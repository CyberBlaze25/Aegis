package db

import (
	"context"
	"time"

	"gentools/genapi/internal/core/logger"

	"github.com/qdrant/go-client/qdrant"
)

func InitQdrant() (*qdrant.Client, error) {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334,
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

	logger.Log.Info("Sentinel Instinct (Qdrant) Online. Version: %s", health.GetVersion())

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

		logger.Log.Info("Created new Qdrant collection %s", collectionName)
	}

	return client, nil
}
