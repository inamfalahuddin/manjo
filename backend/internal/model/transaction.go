package model

import (
	"time"

	"gorm.io/gorm"
)

// Struktur data utama untuk transaksi (Tabel Database)
type Transaction struct {
	gorm.Model
	MerchantID         string     `json:"merchant_id" gorm:"not null"`
	Amount             float64    `json:"amount" gorm:"not null"`
	TrxID              string     `json:"trx_id" gorm:"unique;not null"`
	PartnerReferenceNo string     `json:"partner_reference_no" gorm:"unique;not null"`
	ReferenceNo        string     `json:"reference_no" gorm:"unique;not null"` // Internal Ref
	Status             string     `json:"status" gorm:"not null;default:'PENDING'"`
	TransactionDate    time.Time  `json:"transaction_date"`
	PaidDate           *time.Time `json:"paid_date"`
}

// Struct untuk Amount dengan value dan currency
type Amount struct {
	Value    string `json:"value" validate:"required"`
	Currency string `json:"currency" validate:"required"`
}

// Request Body
type GenerateQRRequest struct {
	PartnerReferenceNo string `json:"partnerReferenceNo" validate:"required"`
	Amount             Amount `json:"amount" validate:"required"`
	MerchantID         string `json:"merchantId" validate:"required"`
}

// Response Body
type GenerateQRResponse struct {
	ResponseCode       string `json:"responseCode"`
	ResponseMessage    string `json:"responseMessage"`
	ReferenceNo        string `json:"referenceNo"`
	PartnerReferenceNo string `json:"partnerReferenceNo"`
	QRContent          string `json:"qrContent"`
}

// Request Body untuk endpoint callback payment
type PaymentCallbackRequest struct {
	OriginalReferenceNo        string `json:"originalReferenceNo" validate:"required"`        // ReferenceNo internal (A0000000577)
	OriginalPartnerReferenceNo string `json:"originalPartnerReferenceNo" validate:"required"` // PartnerReferenceNo (DIRECT-API-NMS-whhq7gvx58)
	TransactionStatusDesc      string `json:"transactionStatusDesc" validate:"required"`      // Success, Failed, dll
	PaidTime                   string `json:"paidTime" validate:"required"`                   // 2025-09-21T09:25:00+07:00
	Amount                     Amount `json:"amount" validate:"required"`                     // {value: "10000.00", currency: "IDR"}
}

// Response Body untuk callback payment
type PaymentCallbackResponse struct {
	ResponseCode          string `json:"responseCode"`          // 2005100
	ResponseMessage       string `json:"responseMessage"`       // Successful
	TransactionStatusDesc string `json:"transactionStatusDesc"` // Success
}
