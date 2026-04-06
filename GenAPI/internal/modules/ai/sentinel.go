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
	
	systemPrompt := `You are the Aegis Sentinel AI. Evaluate the network telemetry and assign a Contextual Risk Score (crs) from 0.0 to 1.0.
	
	You MUST use this strict scoring rubric:
	- 0.1 to 0.3 (LOW): Developer/Admin testing. Triggered if UID is 1000+ AND the parent process is a terminal/shell (bash, zsh, tmux).
	- 0.4 to 0.6 (MEDIUM): Suspicious but unconfirmed. (e.g., unexpected port but run by a known user).
	- 0.7 to 1.0 (CRITICAL): Actual Exploits. Triggered if UID is a system user (like 33/www-data) spawning network tools, OR orphaned processes (PPID < 2), OR clear C2 beaconing.

	Respond ONLY in JSON:
	{
		"crs": <float>,
		"verdict": "<short explanation tying back to the rubric>"
	}`

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
