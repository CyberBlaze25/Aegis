package main

import (
	// External

	"os"

	// Internal
	config "gentools/genapi/configs"
	"gentools/genapi/internal/core/db"
	"gentools/genapi/internal/core/logger"
	"gentools/genapi/internal/core/router"
)

func main() {
	// Load config
	cfg, err := config.LoadConfig("configs/config.yml")
	if err != nil {
		panic("Failed to load config: " + err.Error())
	}

	// Initialize the logger
	logger.InitLogger()

	// Open a new global dbpool and close it when out of scope
	dbpool := db.OpenNewDbPool(os.Getenv("DB_URL"))
	defer dbpool.Pool.Close()

	// open a new VectorDB connection
	qdrantClient, err := db.InitQdrant(cfg.Qdrant.Host, cfg.Qdrant.Port)
	if err != nil {
		logger.Log.Error("Failed to connect to Qdrant VectorDB: %v", err)
	}

	// Create and run the gin router with appropriate middlewares
	router.NewRouterRun("0.0.0.0:8080", dbpool, qdrantClient, cfg)
}
