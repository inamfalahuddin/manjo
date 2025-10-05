package main

import (
	"log"
	_ "qr-service/docs"

	"qr-service/config"
	"qr-service/internal/handler"
	"qr-service/internal/repository"
	"qr-service/internal/router"
	"qr-service/internal/service"
	ws "qr-service/pkg/websocket"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
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

	wsHub := ws.NewHub()
	go wsHub.Run()

	// Inisialisasi komponen MVC
	wsHandler := handler.NewWebSocketHandler(wsHub)
	transactionRepo := repository.NewTransactionRepository(db)
	transactionService := service.NewTransactionService(transactionRepo, wsHub)
	transactionHandler := handler.TransactionHandler{Service: transactionService}

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000, http://localhost:5173, http://127.0.0.1:5173, http://0.0.0.0:8081", // Frontend URLs
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Signature, X-Requested-With",
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	app.Use(logger.New())

	router.SetupRoutes(app, &transactionHandler, wsHandler)

	log.Fatal(app.Listen(":8000"))
}
