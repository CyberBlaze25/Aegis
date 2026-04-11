package main

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"
)

type InterceptedPayload struct {
	Timestamp time.Time `json:"timestamp"`
	SourceIP  string    `json:"source_ip"`
	Data      string    `json:"data"` // Raw text or Hex
}

var (
	payloads []InterceptedPayload
	mu       sync.Mutex
)

func main() {
	// 1. Start the HTTP API for the React UI (Port 8081)
	go func() {
		http.HandleFunc("/api/honeypod/logs", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Access-Control-Allow-Origin", "*")
			mu.Lock()
			defer mu.Unlock()
			json.NewEncoder(w).Encode(payloads)
		})
		fmt.Println("🌐 Honeypod API listening on :8081")
		http.ListenAndServe(":8081", nil)
	}()

	// 2. Start the Raw TCP Trap (Port 4444)
	trap, err := net.Listen("tcp", ":4444")
	if err != nil {
		panic(err)
	}
	defer trap.Close()
	fmt.Println("🍯 Honeypod Trap listening on :4444 (Waiting for malware...)")

	for {
		conn, err := trap.Accept()
		if err != nil {
			continue
		}
		go handleTrap(conn)
	}
}

func handleTrap(conn net.Conn) {
	defer conn.Close()
	buffer := make([]byte, 4096)

	// Send a fake prompt so the malware thinks it successfully connected to a shell
	conn.Write([]byte("root@ubuntu:~# "))

	n, err := conn.Read(buffer)
	if err != nil || n == 0 {
		return
	}

	rawText := string(buffer[:n])

	mu.Lock()
	payloads = append([]InterceptedPayload{{
		Timestamp: time.Now(),
		SourceIP:  conn.RemoteAddr().String(),
		Data:      rawText,
	}}, payloads...) // Prepend so newest is first

	// Keep max 50 payloads in memory
	if len(payloads) > 50 {
		payloads = payloads[:50]
	}
	mu.Unlock()

	fmt.Printf("🚨 INTERCEPTED: %s\n", rawText)
}
