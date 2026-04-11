package telemetry

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	config "gentools/genapi/configs"
	"gentools/genapi/internal/core/db"
	"gentools/genapi/internal/core/logger"
	"gentools/genapi/internal/modules/ai"
	"gentools/genapi/internal/modules/brazil"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/qdrant/go-client/qdrant"
)

// --- STRUCTS ---
type TelemetryPayload struct {
	EventType int     `json:"event_type"` // 1 = Network, 2 = Execution
	PID       int     `json:"pid"`
	PPID      int     `json:"ppid"`
	UID       int     `json:"uid"`
	Comm      string  `json:"comm"`
	Filename  string  `json:"filename,omitempty"`
	DestIP    string  `json:"dest_ip,omitempty"`
	DestPort  int     `json:"dest_port,omitempty"`
	Score     float64 `json:"score"`
	Reason    string  `json:"reason"`
}

type HoneypodPayload struct {
	SourceIP string `json:"source_ip"`
	Data     string `json:"data"`
}

type TelemetryController struct {
	Hub    *Hub
	DB     *db.PGX
	Qdrant *qdrant.Client
	Cfg    *config.Config
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ==========================================
// ENDPOINT 1: TELEMETRY INGESTION & DEFENSE
// ==========================================
func (tc *TelemetryController) IngestTelemetry(c *gin.Context) {
	var payload TelemetryPayload

	// Create the struct reference WITHOUT calling the system mkdir command again
	brazilProto := &brazil.BrazilProtocol{
		HoneypodIP:   "172.18.0.5",
		HoneypodPort: "4444",
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid telemetry payload"})
		return
	}

	// 1. Broadcast to UI immediately so it doesn't freeze waiting for Groq
	tc.Hub.Broadcast <- payload

	// 2. Build behavior string
	var behaviorStr string
	if payload.EventType == 2 {
		behaviorStr = fmt.Sprintf("Process spawned: UID %d executed %s via %s", payload.UID, payload.Filename, payload.Comm)
	} else {
		behaviorStr = fmt.Sprintf("Network connect: UID %d process %s connecting to %s:%d", payload.UID, payload.Comm, payload.DestIP, payload.DestPort)
	}

	// 3. Process the AI/DB logic in the background
	go func(p TelemetryPayload, bStr string) {
		ctx := context.Background()

		vector, err := ai.GetEmbedding(*tc.Cfg, bStr)
		if err != nil {
			logger.Log.Error("Embedding failed", slog.Any("Error", err))
			return
		}

		// FAST PATH: Check Qdrant for Zero-Day Immunity
		reflexMatch, err := tc.Qdrant.Query(ctx, &qdrant.QueryPoints{
			CollectionName: "aegis_signatures",
			Query:          qdrant.NewQuery(vector...),
			Limit:          &[]uint64{1}[0],
			WithPayload:    qdrant.NewWithPayload(true),
		})

		if err == nil && len(reflexMatch) > 0 && reflexMatch[0].Score > 0.90 {
			p.Score = 1.00
			p.Reason = "QDRANT REFLEX: Known Malicious Behavioral Signature Match"
			logger.Log.Warn("⚡ QDRANT REFLEX TRIGGERED. Bypassing LLM.", slog.Int("PID", p.PID))
			brazilProto.RedirectToHoneypod(p.PID, p.DestPort)
		} else {
			// SLOW PATH: Ask Groq
			analysis, err := ai.EvalThreat(tc.Cfg, bStr, "General anomalous activity")
			if err != nil {
				logger.Log.Error("Sentinel Brain Error", slog.Any("Error", err))
				return
			}

			p.Score = analysis.Score
			p.Reason = analysis.Verdict

			// Log the AI's mind to your terminal
			logger.Log.Info("🧠 SENTINEL VERDICT",
				slog.Float64("Score", p.Score),
				slog.String("Reason", p.Reason),
				slog.Int("PID", p.PID),
			)

			// Apply Enforcement
			if p.Score >= 0.90 {
				logger.Log.Warn("🔴 DEFCON 1: Isolating PID to Honeypod", slog.Int("PID", p.PID))
				brazilProto.RedirectToHoneypod(p.PID, p.DestPort)
			} else if p.Score >= 0.70 {
				logger.Log.Warn("🟡 DEFCON 2: Microsegmenting PID", slog.Int("PID", p.PID))
				brazilProto.IsolatePID(p.PID)
			}
		}

		// Update the UI with the final score
		tc.Hub.Broadcast <- p

		// Save to DB
		record := db.TelemetryRecord{
			Timestamp: time.Now(),
			PID:       p.PID,
			PPID:      p.PPID,
			UID:       p.UID,
			Comm:      p.Comm,
			DestIP:    p.DestIP,
			DestPort:  p.DestPort,
			Score:     p.Score,
			Reason:    p.Reason,
		}

		if err := tc.DB.InsertTelemetry(context.Background(), record); err != nil {
			logger.Log.Error("DB Write Failed", slog.Any("Error", err))
		}
	}(payload, behaviorStr)

	c.JSON(http.StatusOK, gin.H{"status": "ingested"})
}

// ==========================================
// ENDPOINT 2: HONEYPOD WEBHOOK
// ==========================================
func (tc *TelemetryController) IngestHoneypodWebhook(c *gin.Context) {
	var hp HoneypodPayload
	if err := c.ShouldBindJSON(&hp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid honeypod payload"})
		return
	}

	logger.Log.Info("🍯 HONEYPOD PAYLOAD RECEIVED", slog.String("Data", hp.Data))

	go func(data string, sourceIP string) {
		ctx := context.Background()

		vector, err := ai.GetEmbedding(*tc.Cfg, data)
		if err != nil {
			logger.Log.Error("Failed to vectorize honeypod payload", slog.Any("Error", err))
			return
		}

		points := []*qdrant.PointStruct{
			{
				Id:      qdrant.NewIDNum(uint64(time.Now().UnixNano())),
				Vectors: qdrant.NewVectorsDense(vector),
				Payload: qdrant.NewValueMap(map[string]any{
					"raw_payload": data,
					"source_ip":   sourceIP,
					"timestamp":   time.Now().Format(time.RFC3339),
				}),
			},
		}

		_, err = tc.Qdrant.Upsert(ctx, &qdrant.UpsertPoints{
			CollectionName: "aegis_signatures",
			Points:         points,
		})

		if err != nil {
			logger.Log.Error("Failed to sync signature to Qdrant", slog.Any("Error", err))
		} else {
			logger.Log.Info("✅ IMMUNITY ACHIEVED: Signature synced to Qdrant!")
		}
	}(hp.Data, hp.SourceIP)

	c.JSON(http.StatusOK, gin.H{"status": "Vectorized and stored"})
}

// ==========================================
// ENDPOINT 3 & 4: WEBSOCKETS & HISTORY
// ==========================================
func (tc *TelemetryController) GetHistory(c *gin.Context) {
	w := c.Writer
	r := c.Request

	records, err := tc.DB.GetTelemetryHistory(r.Context(), 50)
	if err != nil {
		http.Error(w, "Failed to fetch history", http.StatusInternalServerError)
		return
	}

	if records == nil {
		records = []db.TelemetryRecord{}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(records)
}

func (tc *TelemetryController) ServeWS(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	tc.Hub.register <- conn
}
