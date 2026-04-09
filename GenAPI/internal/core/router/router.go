package router

import (
	config "gentools/genapi/configs"
	"gentools/genapi/internal/core/db"
	auth_m "gentools/genapi/internal/middleware/auth_m"
	logger_m "gentools/genapi/internal/middleware/logger"
	"gentools/genapi/internal/modules/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/qdrant/go-client/qdrant"
)

func NewRouterRun(url string, db *db.PGX, qdClient *qdrant.Client, cfg *config.Config) {
	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(logger_m.GenLogger())

	hub := telemetry.NewHub()
	go hub.Run()

	telemetryCtrl := &telemetry.TelemetryController{
		Hub:    hub,
		DB:     db,
		Qdrant: qdClient,
		Cfg:    cfg,
	}

	r.GET("/api/v1/telemetry/live", telemetryCtrl.ServeWS)
	r.GET("/api/v1/telemetry/history", telemetryCtrl.GetHistory)

	r.Use(auth_m.GenAuth(db.Pool, cfg))
	r.POST("/api/v1/telemetry", telemetryCtrl.IngestTelemetry)

	r.Run(cfg.Server.Host + ":" + cfg.Server.Port)
}
