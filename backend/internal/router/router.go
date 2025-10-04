package router

import (
	"qr-service/internal/handler"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	fiberws "github.com/gofiber/websocket/v2"
)

func SetupRoutes(app *fiber.App, transactionHandler *handler.TransactionHandler, wsHandler *handler.WebSocketHandler) {
	// Basic routes
	app.Get("/", handler.WelcomeHandler)

	// Health check
	app.Get("/health", healthCheck)

	// WebSocket routes
	setupWebSocketRoutes(app, wsHandler)

	// API v1 routes
	setupAPIV1Routes(app, transactionHandler)

	// Documentation routes
	setupDocumentationRoutes(app)
}

func setupWebSocketRoutes(app *fiber.App, wsHandler *handler.WebSocketHandler) {
	wsGroup := app.Group("/ws")

	// WebSocket middleware
	wsGroup.Use(func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	// WebSocket connection
	wsGroup.Get("/", fiberws.New(wsHandler.WebSocketConnection))

	// WebSocket info
	app.Get("/websocket-info", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"websocket_endpoint": "ws://localhost:8000/ws",
			"protocol":           "WebSocket",
			"description":        "Realtime transaction updates",
		})
	})
}

func setupAPIV1Routes(app *fiber.App, transactionHandler *handler.TransactionHandler) {
	api := app.Group("/api/v1")

	// QR routes dengan HMAC validation
	qr := api.Group("/qr")
	qr.Post("/generate", handler.ValidateHMAC, transactionHandler.GenerateQR)
	qr.Post("/payment", handler.ValidateHMAC, transactionHandler.ProcessPaymentCallback)

	// Transaction routes (tanpa HMAC)
	transactions := api.Group("/transactions")
	transactions.Get("/", transactionHandler.GetTransactions)

	// Utility routes (jika ada)
	// utils := api.Group("/utils")
	// utils.Post("/generate-signature", transactionHandler.GenerateSignature)
}

func setupDocumentationRoutes(app *fiber.App) {
	// Swagger documentation
	app.Get("/docs/*", swagger.HandlerDefault)

	// API documentation info
	app.Get("/docs", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"swagger":     "http://localhost:8000/docs/",
			"version":     "1.0",
			"description": "QR Payment API Documentation",
		})
	})
}

func healthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "QR Payment API",
		"version": "1.0",
	})
}
