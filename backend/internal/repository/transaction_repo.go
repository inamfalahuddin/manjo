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
