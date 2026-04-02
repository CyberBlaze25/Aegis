package db

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"gentools/genapi/internal/core/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

func OpenNewDbPool(db_url string) *pgxpool.Pool {
	fmt.Printf("Connecting to database at: %s\n", db_url)

	// Create the actual database link
	dbpool, err := pgxpool.New(context.Background(), db_url)
	if err != nil {
		logger.Log.Error("Unable to create DB Pool.", slog.Any("Error", err))
	}

	// Use the database link to check if it is alive, if not exit with code 1
	if err := dbpool.Ping(context.Background()); err != nil {
		logger.Log.Error("Unable to Ping database.", slog.Any("Error", err))
		os.Exit(1)
	}

	return dbpool
}
