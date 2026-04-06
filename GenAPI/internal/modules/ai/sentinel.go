package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	config "gentools/genapi/configs"
)

const groqAPIUrl = "https://api.groq.com/openai/v1/chat/completions"

type CRSResponse struct {
	Score   float64 `json:"crs"`
	Verdict string  `json:"verdict"`
}

func EvalThreat(cfg *config.Config, telemetry string, mitreContext string) (*CRSResponse, error) {
	apiKey := cfg.Groq.APIKEY

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	systemPrompt := `You are the Aegis Sentinel AI. You must respond ONLY in valid JSON.
	Analyze the telemetry against MITRE TTPs. 
	JSON Schema:
	{
		"crs": (float between 0.0 and 1.0),
		"verdict": (max 10 words string)
	}
	Strictly ensure "crs" is a decimal number.`

	userPrompt := fmt.Sprintf("Telemetry: %s\nMITRE Context: %s", telemetry, mitreContext)

	payload := map[string]interface{}{
		"model": "llama-3.1-8b-instant",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"response_format": map[string]string{"type": "json_object"},
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequestWithContext(ctx, "POST", groqAPIUrl, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return nil, fmt.Errorf("Groq API failed %d: %s", resp.StatusCode, string(body))
	}
	defer resp.Body.Close()

	respBody, _ := ioutil.ReadAll(resp.Body)

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &groqResp)

	var result CRSResponse
	json.Unmarshal([]byte(groqResp.Choices[0].Message.Content), &result)

	return &result, nil
}
