package handler

import (
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	fiberws "github.com/gofiber/websocket/v2"
	"github.com/google/uuid"

	ws "qr-service/pkg/websocket"
)

type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler(hub *ws.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

// @Summary WebSocket Connection
// @Description WebSocket endpoint for realtime transaction updates
// @Tags WebSocket
// @Router /ws [get]
func (h *WebSocketHandler) HandleWebSocket(c *fiber.Ctx) error {
	if fiberws.IsWebSocketUpgrade(c) {
		return c.Next()
	}
	return fiber.ErrUpgradeRequired
}

func (h *WebSocketHandler) WebSocketConnection(c *fiberws.Conn) {
	client := &ws.Client{
		ID:   uuid.New().String(),
		Send: make(chan []byte, 256),
	}

	// Register client
	h.hub.Register(client)

	// Goroutine untuk mengirim messages ke client
	go h.writePump(c, client)

	// Goroutine untuk membaca messages dari client (keep connection alive)
	h.readPump(c, client)
}

// writePump handles sending messages to the client
func (h *WebSocketHandler) writePump(c *fiberws.Conn, client *ws.Client) {
	defer func() {
		h.hub.Unregister(client)
		c.Close()
	}()

	// Gunakan for range pada channel
	for message := range client.Send {
		if err := c.WriteMessage(fiberws.TextMessage, message); err != nil {
			break
		}
	}
}

// readPump handles receiving messages from the client
func (h *WebSocketHandler) readPump(c *fiberws.Conn, client *ws.Client) {
	defer func() {
		h.hub.Unregister(client)
		c.Close()
	}()

	// Set read deadline dan handle ping/pong
	c.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.SetPongHandler(func(string) error {
		c.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		messageType, _, err := c.ReadMessage()
		if err != nil {
			break
		}
		if messageType == fiberws.CloseMessage {
			break
		}

		// Reset read deadline untuk keep connection alive
		c.SetReadDeadline(time.Now().Add(60 * time.Second))
	}
}

// BroadcastTransactionUpdate mengirim update transaksi ke semua connected clients
func (h *WebSocketHandler) BroadcastTransactionUpdate(transaction interface{}) error {
	message := map[string]interface{}{
		"type":      "TRANSACTION_UPDATE",
		"data":      transaction,
		"timestamp": time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	h.hub.Broadcast(messageBytes)
	return nil
}
