package telemetry

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
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
	Hub *Hub
	DB  *pgxpool.Pool
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
