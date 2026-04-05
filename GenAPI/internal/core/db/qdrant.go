package db

import (
	"context"
	"log/slog"
	"time"

	"gentools/genapi/internal/core/logger"

	"github.com/qdrant/go-client/qdrant"
)

func InitQdrant(host string, port int) (*qdrant.Client, error) {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: host,
		Port: port,
	})
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	health, err := client.HealthCheck(ctx)
	if err != nil {
		return nil, err
	}

	logger.Log.Info("Sentinel Instinct (Qdrant) Online.", slog.Any("Version", health.GetVersion()))

	collectionName := "mitre_ttps"

	exists, err := client.CollectionExists(ctx, collectionName)
	if err != nil {
		return nil, err
	}

	if !exists {
		err = client.CreateCollection(ctx, &qdrant.CreateCollection{
			CollectionName: collectionName,
			VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
				Size:     384,
				Distance: qdrant.Distance_Cosine,
			}),
		})
		if err != nil {
			return nil, err
		}

		logger.Log.Info("Created new Qdrant collection", slog.Any("Name", collectionName))
	}

	return client, nil
}
