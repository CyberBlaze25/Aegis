package db

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"os"
	"time"

	"gentools/genapi/internal/core/logger"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGX struct {
	Pool *pgxpool.Pool
}

// TelemetryRecord represents the data we send to the frontend and store in the DB
type TelemetryRecord struct {
	Timestamp time.Time `json:"timestamp"`
	PID       int       `json:"pid"`
	PPID      int       `json:"ppid"`
	UID       int       `json:"uid"`
	Comm      string    `json:"comm"`
	DestIP    string    `json:"dest_ip"`
	DestPort  int       `json:"dest_port"`
	Score     float64   `json:"score"`
	Reason    string    `json:"reason"`
}

// 1. Initialize the Table
func (db *PGX) InitSchema(ctx context.Context) error {
	query := `
	CREATE TABLE IF NOT EXISTS telemetry_logs (
		id SERIAL PRIMARY KEY,
		timestamp TIMESTAMPTZ DEFAULT NOW(),
		pid INT,
		ppid INT,
		uid INT,
		comm VARCHAR(255),
		dest_ip VARCHAR(255),
		dest_port INT,
		score NUMERIC(4,3),
		reason TEXT
	);
	CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_logs(timestamp DESC);`

	_, err := db.Pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}
	log.Println("✅ PostgreSQL: Telemetry Schema Initialized")
	return nil
}

func (db *PGX) InsertTelemetry(ctx context.Context, record TelemetryRecord) error {
	query := `
	INSERT INTO telemetry_logs (pid, ppid, uid, comm, dest_ip, dest_port, score, reason)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

	_, err := db.Pool.Exec(ctx, query,
		record.PID, record.PPID, record.UID, record.Comm,
		record.DestIP, record.DestPort, record.Score, record.Reason,
	)
	return err
}

// 3. The History Fetch (Hydration)
func (db *PGX) GetTelemetryHistory(ctx context.Context, limit int) ([]TelemetryRecord, error) {
	query := `
	SELECT timestamp, pid, ppid, uid, comm, dest_ip, dest_port, score, reason 
	FROM telemetry_logs 
	ORDER BY timestamp DESC 
	LIMIT $1`

	rows, err := db.Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []TelemetryRecord
	for rows.Next() {
		var r TelemetryRecord
		err := rows.Scan(&r.Timestamp, &r.PID, &r.PPID, &r.UID, &r.Comm, &r.DestIP, &r.DestPort, &r.Score, &r.Reason)
		if err != nil {
			log.Printf("⚠️ Error scanning row: %v", err)
			continue
		}
		records = append(records, r)
	}
	return records, nil
}

func OpenNewDbPool(db_url string) *PGX {
	logger.Log.Info("Connecting to PostgreSQL...")

	// Create the actual database link
	dbpool, err := pgxpool.New(context.Background(), db_url)
	if err != nil {
		logger.Log.Error("Unable to create DB Pool.", slog.Any("Error", err))
	}

	dbpgx := PGX{
		Pool: dbpool,
	}

	// Use the database link to check if it is alive, if not exit with code 1
	if err := dbpool.Ping(context.Background()); err != nil {
		logger.Log.Error("Unable to Ping database.", slog.Any("Error", err))
		os.Exit(1)
	}

	if err := dbpgx.InitSchema(context.Background()); err != nil {
		logger.Log.Error("Failed to initialize database schema.", slog.Any("Error", err))
		os.Exit(1)
	}

	return &dbpgx
}
