package repository

import (
	"errors"
	"qr-service/internal/model"
	"time"

	"gorm.io/gorm"
)

type TransactionRepository struct {
	DB *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	// AutoMigrate untuk membuat tabel
	db.AutoMigrate(&model.Transaction{})
	return &TransactionRepository{DB: db}
}

// Implementasi Penyimpanan Data Transaksi ke Database
func (r *TransactionRepository) Save(transaction model.Transaction) (model.Transaction, error) {
	if err := r.DB.Create(&transaction).Error; err != nil {
		return model.Transaction{}, err
	}
	return transaction, nil
}

// Digunakan untuk Validasi dan Callback
func (r *TransactionRepository) FindByReferenceNo(referenceNo string) (model.Transaction, error) {
	var transaction model.Transaction
	err := r.DB.Where("reference_no = ?", referenceNo).First(&transaction).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.Transaction{}, errors.New("transaction not found")
		}
		return model.Transaction{}, err
	}
	return transaction, nil
}

// Digunakan untuk Callback Payment
func (r *TransactionRepository) UpdateStatus(referenceNo string, status string, paidDate time.Time) error {
	// Pastikan hanya update status dan paid_date
	return r.DB.Model(&model.Transaction{}).Where("reference_no = ?", referenceNo).Updates(map[string]interface{}{
		"status":    status,
		"paid_date": paidDate,
	}).Error
}

func (r *TransactionRepository) FindByPartnerReference(partnerRef string) (*model.Transaction, error) {
	var transaction model.Transaction
	err := r.DB.Where("partner_reference_no = ?", partnerRef).First(&transaction).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &transaction, nil
}

func (r *TransactionRepository) GetTransactions(
	referenceNumber string,
	customerID string,
	status string,
	startDate time.Time,
	endDate time.Time,
	search string,
	page int,
	limit int,
) ([]model.Transaction, int64, error) {
	var transactions []model.Transaction
	var total int64

	// Build query
	query := r.DB.Model(&model.Transaction{})

	// Apply filters
	if referenceNumber != "" {
		query = query.Where("reference_number LIKE ?", "%"+referenceNumber+"%")
	}

	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if !startDate.IsZero() {
		query = query.Where("created_at >= ?", startDate)
	}

	if !endDate.IsZero() {
		query = query.Where("created_at <= ?", endDate)
	}

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where(
			"reference_no LIKE ? OR partner_reference_no LIKE ? OR merchant_id LIKE ? OR trx_id LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}
	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	query = query.Offset(offset).Limit(limit).Order("created_at DESC")

	// Execute query
	if err := query.Find(&transactions).Error; err != nil {
		return nil, 0, err
	}

	return transactions, total, nil
}
