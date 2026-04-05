package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"

	"gentools/genapi/internal/core/db" // Your Qdrant init package
	"gentools/genapi/internal/core/logger"
	"gentools/genapi/internal/modules/ai" // Your new embedding package

	"github.com/google/uuid"
	"github.com/qdrant/go-client/qdrant"
)

func main() {
	logger.InitLogger()
	log.Println("Igniting Sentinel Memory Injector...")

	// 1. Connect to Qdrant
	client, err := db.InitQdrant("localhost", 6334)
	if err != nil {
		log.Fatalf("Failed to connect to Qdrant: %v", err)
	}
	defer client.Close()

	// 2. Open your MITRE ATT&CK CSV
	// Assume columns: [TacticID, Name, Description]
	file, err := os.Open("mitre_data.csv")
	if err != nil {
		log.Fatalf("Failed to open CSV: %v", err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("Failed to parse CSV: %v", err)
	}

	ctx := context.Background()
	var points []*qdrant.PointStruct

	// 3. Loop through CSV, Embed, and Prepare for Qdrant
	// Skipping the header row (i = 1)
	for i := 1; i < len(records); i++ {
		tacticID := records[i][0]
		name := records[i][1]
		description := records[i][2]

		// Combine text to give the AI maximum context
		fullContext := fmt.Sprintf("MITRE TTP: %s - %s. Description: %s", tacticID, name, description)

		log.Printf("Embedding TTP: %s...", tacticID)
		vector, err := ai.GetEmbedding(fullContext)
		if err != nil {
			log.Printf("Failed to embed %s: %v", tacticID, err)
			continue
		}

		// 4. Create the Qdrant Data Point (Vector + Metadata Payload)
		point := &qdrant.PointStruct{
			Id:      qdrant.NewIDUUID(uuid.New().String()),
			Vectors: qdrant.NewVectors(vector...),
			Payload: qdrant.NewValueMap(map[string]any{
				"tactic_id":   tacticID,
				"name":        name,
				"description": description,
			}),
		}
		points = append(points, point)
	}

	// 5. Inject into Qdrant in one massive batch!
	log.Printf("Injecting %d vectors into Qdrant collection 'mitre_ttps'...", len(points))
	_, err = client.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: "mitre_ttps",
		Points:         points,
	})
	if err != nil {
		log.Fatalf("Failed to upload to Qdrant: %v", err)
	}

	log.Println("🟢 Sentinel Memory Injection Complete! The Brain is ready.")
}
