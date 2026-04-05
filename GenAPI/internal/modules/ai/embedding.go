package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	config "gentools/genapi/configs"
)

const hfAPIUrl = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"

func GetEmbedding(cfg config.Config, text string) ([]float32, error) {
	reqBody, _ := json.Marshal(map[string][]string{"inputs": {text}})

	req, err := http.NewRequest("POST", hfAPIUrl, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.HFToken.Token) // Uncomment if using a token

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Embedding API failed with status: %d", resp.StatusCode)
	}

	body, _ := ioutil.ReadAll(resp.Body)

	// HF returns a 2D array: [[float, float, ...]]
	var result [][]float32
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("No embedding returned")
	}
	return result[0], nil
}
