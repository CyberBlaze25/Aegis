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
	defer dbpool.Close()

	// Create and run the gin router with appropriate middlewares
	router.NewRouterRun("0.0.0.0:8080", dbpool, cfg)
}
