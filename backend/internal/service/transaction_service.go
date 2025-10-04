package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"qr-service/internal/model"
	"qr-service/internal/repository"
	"qr-service/pkg/util"
	"strconv"
	"strings"
	"time"

	ws "qr-service/pkg/websocket"
)

type TransactionService struct {
	Repo         *repository.TransactionRepository
	RefGenerator util.ReferenceGenerator
	QRGenerator  util.QRGenerator
	StatusMapper util.StatusMapper
	WSHub        *ws.Hub
}

func NewTransactionService(repo *repository.TransactionRepository, wsHub *ws.Hub) *TransactionService {
	return &TransactionService{Repo: repo, RefGenerator: util.NewReferenceGenerator("A"), QRGenerator: util.NewQRGenerator(), StatusMapper: util.NewStatusMapper(), WSHub: wsHub}
}

// Implementasi Endpoint POST /api/v1/qr/generate
func (s *TransactionService) GenerateQR(req model.GenerateQRRequest) (model.GenerateQRResponse, error) {
	// 1. Parse amount dari string ke float64
	amount, err := strconv.ParseFloat(req.Amount.Value, 64)
	if err != nil {
		return model.GenerateQRResponse{}, errors.New("invalid amount format")
	}

	// 2. Validasi Amount
	if amount <= 0 {
		return model.GenerateQRResponse{}, errors.New("amount must be greater than 0")
	}

	// 3. Validasi Currency
	if req.Amount.Currency != "IDR" {
		return model.GenerateQRResponse{}, errors.New("only IDR currency is supported")
	}

	// 4. Cek apakah partner_reference_no sudah ada
	existing, err := s.Repo.FindByPartnerReference(req.PartnerReferenceNo)
	if err != nil {
		return model.GenerateQRResponse{}, fmt.Errorf("failed to check existing transaction: %w", err)
	}

	// 5. Jika sudah ada, return data existing
	if existing != nil {
		return model.GenerateQRResponse{
			ResponseCode:       "2004700",
			ResponseMessage:    "Successful",
			ReferenceNo:        existing.ReferenceNo,
			PartnerReferenceNo: existing.PartnerReferenceNo,
			QRContent:          s.QRGenerator.GenerateQRContent(existing.MerchantID, existing.ReferenceNo),
		}, nil
	}

	// 6. Generate ReferenceNo internal (contoh: A0000000577)
	referenceNo := s.RefGenerator.GenerateReferenceNo()

	// 7. Generate TrxID dari partnerReferenceNo (untuk uniqueness)
	trxID := "TRX-" + req.PartnerReferenceNo

	// 8. Simpan transaksi baru
	transaction := model.Transaction{
		MerchantID:         req.MerchantID,
		Amount:             amount,
		TrxID:              trxID,
		PartnerReferenceNo: req.PartnerReferenceNo,
		ReferenceNo:        referenceNo,
		Status:             "PENDING",
		TransactionDate:    time.Now(),
	}

	_, err = s.Repo.Save(transaction)
	if err != nil {
		// Tangani error duplicate secara spesifik
		if strings.Contains(err.Error(), "23505") ||
			strings.Contains(err.Error(), "unique constraint") ||
			strings.Contains(err.Error(), "duplicate key") {
			return model.GenerateQRResponse{}, fmt.Errorf("duplicate key: transaction with reference %s already exists", req.PartnerReferenceNo)
		}
		return model.GenerateQRResponse{}, fmt.Errorf("failed to save transaction: %w", err)
	}

	// 9. Return response sukses
	return model.GenerateQRResponse{
		ResponseCode:       "2004700",
		ResponseMessage:    "Successful",
		ReferenceNo:        referenceNo,
		PartnerReferenceNo: req.PartnerReferenceNo,
		QRContent:          s.QRGenerator.GenerateQRContent(req.MerchantID, referenceNo),
	}, nil
}

// Implementasi Endpoint POST /api/v1/qr/payment
func (s *TransactionService) ProcessPaymentCallback(req model.PaymentCallbackRequest) (model.PaymentCallbackResponse, error) {
	// 1. Parse amount dari string ke float64
	amount, err := strconv.ParseFloat(req.Amount.Value, 64)
	if err != nil {
		return model.PaymentCallbackResponse{}, errors.New("invalid amount format")
	}

	// 2. Validasi Currency
	if req.Amount.Currency != "IDR" {
		return model.PaymentCallbackResponse{}, errors.New("only IDR currency is supported")
	}

	// 3. Validasi reference_number (Cek keberadaan di database)
	trx, err := s.Repo.FindByReferenceNo(req.OriginalReferenceNo)
	if err != nil {
		return model.PaymentCallbackResponse{}, errors.New("transaction not found")
	}

	// 4. Validasi partner reference number
	if trx.PartnerReferenceNo != req.OriginalPartnerReferenceNo {
		return model.PaymentCallbackResponse{}, errors.New("partner reference number mismatch")
	}

	// 5. Validasi amount
	if trx.Amount != amount {
		return model.PaymentCallbackResponse{}, errors.New("amount mismatch")
	}

	// 6. Parse paidTime
	paidTime, err := time.Parse(time.RFC3339, req.PaidTime)
	if err != nil {
		return model.PaymentCallbackResponse{}, errors.New("invalid paidTime format")
	}

	// 7. Map transactionStatusDesc ke status internal
	status := s.StatusMapper.MapTransactionStatus(req.TransactionStatusDesc)

	// 8. Update Status Transaksi jika status berubah
	if trx.Status != status {
		err = s.Repo.UpdateStatus(req.OriginalReferenceNo, status, paidTime)
		if err != nil {
			return model.PaymentCallbackResponse{}, errors.New("failed to update status: " + err.Error())
		}

		updatedTrx, err := s.Repo.FindByReferenceNo(req.OriginalReferenceNo)
		if err == nil {
			s.broadcastTransactionUpdate(&updatedTrx)
		}
	}

	// 9. Return response sesuai format yang diminta
	return model.PaymentCallbackResponse{
		ResponseCode:          "2005100",
		ResponseMessage:       "Successful",
		TransactionStatusDesc: req.TransactionStatusDesc,
	}, nil
}

// Implementasi Endpoint GET /api/v1/transactions
func (s *TransactionService) GetTransactions(req model.GetTransactionsRequest) (*model.GetTransactionsResponse, error) {
	// Validasi dan mapping status jika ada
	if req.Status != "" {
		if !s.StatusMapper.IsValidStatus(req.Status) {
			return nil, fmt.Errorf("invalid status: %s", req.Status)
		}
		// Map external status ke internal status jika perlu
		req.Status = s.StatusMapper.GetInternalStatus(req.Status)
	}

	// Set default values untuk pagination
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	// Parse dates jika ada
	var startTime, endTime time.Time
	var err error

	if req.StartDate != "" {
		startTime, err = time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return nil, fmt.Errorf("invalid start date format, use YYYY-MM-DD")
		}
	}

	if req.EndDate != "" {
		endTime, err = time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return nil, fmt.Errorf("invalid end date format, use YYYY-MM-DD")
		}
		// Set end time to end of day
		endTime = endTime.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
	}

	// Panggil repository
	transactions, total, err := s.Repo.GetTransactions(
		req.ReferenceNumber,
		req.CustomerID,
		req.Status,
		startTime,
		endTime,
		req.Search,
		req.Page,
		req.Limit,
	)
	if err != nil {
		return nil, err
	}

	// Map ke response
	var transactionResponses []model.TransactionResponse
	for _, transaction := range transactions {
		transactionResponses = append(transactionResponses, model.TransactionResponse{
			TrxID:           transaction.TrxID,
			MerchantID:      transaction.MerchantID,
			ReferenceNo:     transaction.ReferenceNo,
			Amount:          transaction.Amount,
			Status:          transaction.Status,
			TransactionDate: transaction.TransactionDate,
			PaidDate:        transaction.PaidDate,
			Currency:        transaction.Currency,
			CreatedAt:       transaction.CreatedAt,
			UpdatedAt:       transaction.UpdatedAt,
		})
	}

	// Hitung pagination
	totalPage := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	response := &model.GetTransactionsResponse{
		ResponseCode:    "200",
		ResponseMessage: "Success",
		Data:            transactionResponses,
		Pagination: &model.PaginationInfo{
			Page:      req.Page,
			Limit:     req.Limit,
			Total:     int(total),
			TotalPage: totalPage,
		},
	}

	return response, nil
}

func (s *TransactionService) broadcastTransactionUpdate(transaction *model.Transaction) {
	if s.WSHub != nil {
		updateData := map[string]interface{}{
			"type":               "TRANSACTION_UPDATE",
			"id":                 transaction.ID,
			"referenceNo":        transaction.ReferenceNo,
			"partnerReferenceNo": transaction.PartnerReferenceNo,
			"merchantId":         transaction.MerchantID,
			"amount":             transaction.Amount,
			"status":             transaction.Status,
			"transactionDate":    transaction.TransactionDate.Format(time.RFC3339),
			"paidDate":           nil,
			"updatedAt":          transaction.UpdatedAt.Format(time.RFC3339),
			"timestamp":          time.Now().Unix(),
		}

		// Format paidDate jika ada
		if transaction.PaidDate != nil {
			updateData["paidDate"] = transaction.PaidDate.Format(time.RFC3339)
		}

		// Convert ke JSON dan broadcast
		messageBytes, err := json.Marshal(updateData)
		if err == nil {
			s.WSHub.Broadcast(messageBytes)
			log.Printf("📢 Broadcast transaction update: %s - %s", transaction.ReferenceNo, transaction.Status)
		}
	}
}
