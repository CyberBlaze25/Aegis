package telemetry

import (
	"fmt"
	"log"
	"net/http"

	config "gentools/genapi/configs"
	"gentools/genapi/internal/modules/ai"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/qdrant/go-client/qdrant"
)

type TelemetryPayload struct {
	PID         uint32  `json:"pid"`
	Comm        string  `json:"comm"`
	DestIP      string  `json:"dest_ip"`
	DestPort    uint16  `json:"dest_port"`
	IsAnomalous bool    `json:"is_anomalous"`
	Reason      string  `json:"reason"`
	Score       float64 `json:"score"`
}

type TelemetryController struct {
	Hub    *Hub
	DB     *pgxpool.Pool
	Qdrant *qdrant.Client
	Cfg    *config.Config
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for the hackathon
	},
}

func (tc *TelemetryController) IngestTelemetry(c *gin.Context) {
	var payload TelemetryPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid telemetry payload"})
	}

	tc.Hub.Broadcast <- payload

	// TODO: log the is_anomalous payload into pgsqlDB

	log.Printf("📥 Telemetry received: PID=%d, Anomalous=%v", payload.PID, payload.IsAnomalous)
	if payload.IsAnomalous {
		go func(p TelemetryPayload) {
			log.Println("🧠 Sentinel is thinking...")

			// 1. Get embedding (Using _ because we aren't using the vector yet)
			_, err := ai.GetEmbedding(*tc.Cfg, p.Reason) // Changed 'vector' to '_' to satisfy compiler
			if err != nil {
				log.Printf("❌ Sentinel: Embedding failed: %v", err)
				return
			}
			log.Println("✅ Sentinel: Embedding generated.")

			mitreContext := "T1571: Non-Standard Port usage detected."
			telemetryStr := fmt.Sprintf("PID %d (%s) -> %s:%d", p.PID, p.Comm, p.DestIP, p.DestPort)

			// 2. Evaluate Threat
			analysis, err := ai.EvalThreat(tc.Cfg, telemetryStr, mitreContext)
			if err != nil {
				log.Printf("❌ Sentinel Brain Error: %v", err)
				return
			}

			// 3. Update payload and broadcast
			p.Score = analysis.Score
			p.Reason = analysis.Verdict
			tc.Hub.Broadcast <- p

			log.Printf("🎯 SENTINEL VERDICT: Score=%f, Verdict=%s", analysis.Score, analysis.Verdict)

			if p.Score >= 0.7 {
				log.Printf("🚨 CRITICAL THREAT: Isolating PID %d", p.PID)
				// Trigger Isolation Logic here
			}
		}(payload)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ingested", "messege": "Telemetry processed"})
}

func (tc *TelemetryController) ServeWS(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	// Register the new frontend connection with the Hub
	tc.Hub.register <- conn
}
