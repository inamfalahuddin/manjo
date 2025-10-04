package model

// SignatureRequest harus SAMA PERSIS dengan GenerateQRRequest
type SignatureRequest struct {
	MerchantID      string  `json:"merchant_id" validate:"required"`
	Amount          float64 `json:"amount" validate:"gt=0"` // HARUS float64, sama dengan GenerateQRRequest
	TrxID           string  `json:"trx_id" validate:"required"`
	ReferenceNumber string  `json:"reference_number" validate:"required"`
}

// SignatureResponse response untuk generate signature
type SignatureResponse struct {
	ResponseCode    string        `json:"responseCode"`
	ResponseMessage string        `json:"responseMessage"`
	Data            SignatureData `json:"data"`
}

type SignatureData struct {
	Body      string `json:"body"`
	Signature string `json:"signature"`
	Format    string `json:"format"`
	Note      string `json:"note"`
}
