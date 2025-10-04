package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type Client struct {
	ID   string
	Send chan []byte
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Client registered: %s, total clients: %d", client.ID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: %s, total clients: %d", client.ID, len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Export method untuk register client
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Export method untuk unregister client
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// Export method untuk broadcast message
func (h *Hub) Broadcast(message []byte) {
	h.broadcast <- message
}

// BroadcastJSON mengirim data JSON ke semua clients
func (h *Hub) BroadcastJSON(data interface{}) error {
	message, err := json.Marshal(data)
	if err != nil {
		return err
	}
	h.broadcast <- message
	return nil
}

func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
