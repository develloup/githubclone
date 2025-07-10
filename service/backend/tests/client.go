package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Backend URL
const BaseURL = "http://localhost:3002"

// GET request to the backend
func GetRequest(endpoint string) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", BaseURL, endpoint)
	return http.Get(url)
}

// POST request to the backend
func PostRequest(endpoint string, payload map[string]string) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", BaseURL, endpoint)
	jsonData, _ := json.Marshal(payload)
	return http.Post(url, "application/json", bytes.NewBuffer(jsonData))
}
