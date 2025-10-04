package handler

import (
	"qr-service/internal/model"
	"qr-service/internal/service"
	"qr-service/pkg/util"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type TransactionHandler struct {
	Service *service.TransactionService
}

// Middleware: 3. Validasi Signature Hash (HMAC-SHA256)
func ValidateHMAC(c *fiber.Ctx) error {
	signature := c.Get("X-Signature")

	body := string(c.Body())

	if signature == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"responseCode":    fiber.StatusUnauthorized,
			"responseMessage": "Signature header missing"})
	}

	if !util.ValidateHMACSHA256(signature, body) {
		// Tanggapi request dengan status 401 Unauthorized
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"responseCode":    fiber.StatusUnauthorized,
			"responseMessage": "Invalid Signature Hash"})
	}

	return c.Next()
}

// @Summary Generate QR Code
// @Description Endpoint untuk menghasilkan QR code baru dan menyimpan transaksi ke database dengan status PENDING.
// @Tags QR
// @Accept json
// @Produce json
// @Param X-Signature header string true "HMAC-SHA256 Signature (Body Hash)"
// @Param request body model.GenerateQRRequest true "Data Transaksi yang dibutuhkan"
// @Success 200 {object} model.GenerateQRResponse
// @Failure 400 {object} fiber.Map "Validasi input gagal (misalnya Amount <= 0 atau field kosong)"
// @Failure 401 {object} fiber.Map "Signature Hash tidak valid (Unauthorized)"
// @Failure 500 {object} fiber.Map "Gagal menyimpan data transaksi ke database"
// @Router /qr/generate [post]
func (h *TransactionHandler) GenerateQR(c *fiber.Ctx) error {
	var req model.GenerateQRRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"responseCode":    fiber.StatusBadRequest,
			"responseMessage": "Invalid request body format",
		})
	}

	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"responseCode":    fiber.StatusBadRequest,
			"responseMessage": "Validation failed: " + err.Error(),
		})
	}

	resp, err := h.Service.GenerateQR(req)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "unique constraint") ||
			strings.Contains(err.Error(), "23505") ||
			strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"responseCode":    fiber.StatusConflict,
				"responseMessage": "Transaction with the same reference already exists",
			})
		}
		if strings.Contains(err.Error(), "amount must be greater than 0") ||
			strings.Contains(err.Error(), "invalid amount format") ||
			strings.Contains(err.Error(), "only IDR currency is supported") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"responseCode":    fiber.StatusBadRequest,
				"responseMessage": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"responseCode":    fiber.StatusInternalServerError,
			"responseMessage": "Failed to process QR generation",
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

// @Summary Process Payment Callback
// @Description Endpoint callback dari payment gateway untuk mengupdate status transaksi.
// @Tags QR
// @Accept json
// @Produce json
// @Param X-Signature header string true "HMAC-SHA256 Signature (Body Hash)"
// @Param request body model.PaymentCallbackRequest true "Data Callback Payment"
// @Success 200 {object} model.PaymentCallbackResponse
// @Failure 400 {object} fiber.Map "Input validasi gagal atau data mismatch"
// @Failure 401 {object} fiber.Map "Signature Hash tidak valid"
// @Failure 404 {object} fiber.Map "Reference Number tidak ditemukan"
// @Failure 500 {object} fiber.Map "Gagal mengupdate status transaksi"
// @Router /qr/payment [post]
func (h *TransactionHandler) ProcessPaymentCallback(c *fiber.Ctx) error {
	var req model.PaymentCallbackRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"responseCode":    fiber.StatusBadRequest,
			"responseMessage": "Invalid request body format",
		})
	}

	validate := validator.New()
	if err := validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"responseCode":    fiber.StatusBadRequest,
			"responseMessage": "Validation failed: " + err.Error(),
		})
	}

	resp, err := h.Service.ProcessPaymentCallback(req)

	if err != nil {
		if strings.Contains(err.Error(), "transaction not found") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"responseCode":    fiber.StatusNotFound,
				"responseMessage": err.Error(),
			})
		}
		if strings.Contains(err.Error(), "mismatch") ||
			strings.Contains(err.Error(), "invalid") ||
			strings.Contains(err.Error(), "only IDR") ||
			strings.Contains(err.Error(), "invalid transaction status") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"responseCode":    fiber.StatusBadRequest,
				"responseMessage": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"responseCode":    fiber.StatusInternalServerError,
			"responseMessage": "Failed to process payment callback: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}

// @Summary Get All Transactions
// @Description Endpoint untuk mendapatkan semua transaksi dengan filter dan pagination
// @Tags QR
// @Accept json
// @Produce json
// @Param referenceNumber query string false "Filter by Reference Number"
// @Param customerId query string false "Filter by Customer ID"
// @Param status query string false "Filter by Status (Success, Failed, Pending, Expired, Paid, SUCCESS, FAILED, PENDING, EXPIRED)"
// @Param startDate query string false "Start Date (format: YYYY-MM-DD)"
// @Param endDate query string false "End Date (format: YYYY-MM-DD)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Limit per page (default: 10, max: 100)"
// @Success 200 {object} model.GetTransactionsResponse
// @Failure 400 {object} fiber.Map "Invalid filter parameters"
// @Failure 500 {object} fiber.Map "Internal server error"
// @Router /qr/transactions [get]
func (h *TransactionHandler) GetTransactions(c *fiber.Ctx) error {
	var req model.GetTransactionsRequest

	// Parse query parameters
	req.ReferenceNumber = c.Query("referenceNumber")
	req.CustomerID = c.Query("customerId")
	req.Status = c.Query("status")
	req.StartDate = c.Query("startDate")
	req.EndDate = c.Query("endDate")
	req.Search = c.Query("search")

	// Parse pagination parameters dengan default values
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	req.Page = page

	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	req.Limit = limit

	// Panggil service
	resp, err := h.Service.GetTransactions(req)
	if err != nil {
		if err.Error() == "invalid status" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"responseCode":    fiber.StatusBadRequest,
				"responseMessage": "Invalid status parameter",
			})
		}
		if err.Error() == "invalid start date format, use YYYY-MM-DD" ||
			err.Error() == "invalid end date format, use YYYY-MM-DD" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"responseCode":    fiber.StatusBadRequest,
				"responseMessage": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"responseCode":    fiber.StatusInternalServerError,
			"responseMessage": "Failed to retrieve transactions",
		})
	}

	return c.Status(fiber.StatusOK).JSON(resp)
}
