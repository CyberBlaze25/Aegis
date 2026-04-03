package telemetry

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"

	"gentools/genapi/internal/core/logger"
)

type Hub struct {
	clients    map[*websocket.Conn]bool
	Broadcast  chan interface{} // Channel to receive telemetry from Rust
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan interface{}),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
		clients:    make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			logger.Log.Info("Frontend client connected to Aegis Hub")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()
			logger.Log.Info("Frontend client disconnected")

		case message := <-h.Broadcast:
			h.mu.Lock()
			// Convert payload to JSON
			msgBytes, _ := json.Marshal(message)

			// Broadcast to all connected frontends
			for client := range h.clients {
				err := client.WriteMessage(websocket.TextMessage, msgBytes)
				if err != nil {
					client.Close()
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}
