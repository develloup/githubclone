package common

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

type RestAPIResult[T any] struct {
	Result *T
	Resp   *http.Response
}

// SendRestAPIQuery executes a REST GET call
func SendRestAPIQuery[T any](endpoint, path, token string, islog bool) (*RestAPIResult[T], error) {
	url := strings.TrimRight(endpoint, "/") + "/" + strings.TrimLeft(path, "/")

	if islog {
		fmt.Printf("📡 GET %s\n", url)
	}

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Accept", "application/vnd.github+json")
	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}

	body, err := io.ReadAll(resp.Body)
	defer resp.Body.Close()
	if err != nil {
		return nil, fmt.Errorf("reading body failed: %w", err)
	}
	limit := resp.Header.Get("X-RateLimit-Limit")
	remaining := resp.Header.Get("X-RateLimit-Remaining")
	reset := resp.Header.Get("X-RateLimit-Reset")

	log.Printf("GitHub Rate Limit: %s remaining of %s – resets at %s", remaining, limit, reset)
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API error %d: %s", resp.StatusCode, string(body))
	}

	var payload T
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("unmarshaling failed: %w", err)
	}

	return &RestAPIResult[T]{Result: &payload, Resp: resp}, nil
}
