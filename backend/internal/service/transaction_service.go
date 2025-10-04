package service

import (
	"errors"
	"fmt"
	"qr-service/internal/model"
	"qr-service/internal/repository"
	"qr-service/pkg/util"
	"strconv"
	"strings"
	"time"
)

type TransactionService struct {
	Repo         *repository.TransactionRepository
	RefGenerator util.ReferenceGenerator
	QRGenerator  util.QRGenerator
	StatusMapper util.StatusMapper
}

func NewTransactionService(repo *repository.TransactionRepository) *TransactionService {
	return &TransactionService{Repo: repo, RefGenerator: util.NewReferenceGenerator("A"), QRGenerator: util.NewQRGenerator(), StatusMapper: util.NewStatusMapper()}
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

// Tambahkan pada file internal/service/transaction_service.go
// Logika bisnis untuk Callback Payment
// service/transaction_service.go
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
	}

	// 9. Return response sesuai format yang diminta
	return model.PaymentCallbackResponse{
		ResponseCode:          "2005100",
		ResponseMessage:       "Successful",
		TransactionStatusDesc: req.TransactionStatusDesc,
	}, nil
}
