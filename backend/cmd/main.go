package main

import (
	"log"
	_ "qr-service/docs"

	"qr-service/config"
	"qr-service/internal/handler"
	"qr-service/internal/repository"
	"qr-service/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/swagger"
)

// @title QR Payment API
// @version 1.0
// @description Dokumentasi API untuk layanan QR Generator dan Callback.
// @contact.name Manjo Developer
// @contact.email manjo@example.com
// @host localhost:8000
// @BasePath /api/v1
func main() {
	// 1. Setup Project Backend: Koneksi DB
	db := config.SetupDatabase()

	// Inisialisasi komponen MVC
	repo := repository.NewTransactionRepository(db)
	svc := service.NewTransactionService(repo)
	h := handler.TransactionHandler{Service: svc}

	app := fiber.New()
	app.Use(logger.New())

	app.Get("/", handler.WelcomeHandler)

	api := app.Group("/api/v1")

	// SETUP SWAGER DOCUMENTATION
	app.Get("/doc/*", swagger.HandlerDefault)

	// TUGAS 1A: Implementasi QR Generator
	// Middleware HMAC diterapkan sebelum handler
	api.Post("/qr/generate", handler.ValidateHMAC, h.GenerateQR)

	// TUGAS 1B: Implementasi QR Payment (Callback)
	// (Akan diimplementasikan di bagian selanjutnya)
	api.Post("/qr/payment", handler.ValidateHMAC, h.ProcessPaymentCallback)

	// Utility endpoints (tanpa HMAC validation)
	// utils := api.Group("/utils")
	// utils.Post("/generate-signature", h.GenerateSignature)
	// utils.Post("/debug-signature", h.DebugSignature)

	log.Fatal(app.Listen(":8000"))
}
