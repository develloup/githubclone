package common

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
)

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

func SendGraphQLQuery[T any](endpoint, query, token string, variables map[string]interface{}) (*T, error) {
	requestBody, err := json.Marshal(GraphQLRequest{Query: query, Variables: variables})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	// Anfrage senden
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read answer
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// JSON decoding in generic structure
	var result T
	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
