package common

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
)

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

type GraphQLInit struct {
	Query  string
	Answer string
}

var (
	DefaultFirst = 10 // Default number of entries for a query, maybe for different values there are different default values available
)

func ValidateGraphQLParams(useCursor bool, rawParams map[string]string, additionalParams map[string]map[string]bool) map[string]interface{} {
	params := make(map[string]interface{})

	// If cursor is activated, then add cursor parameters
	if useCursor {
		firstInt, err := strconv.Atoi(rawParams["first"])
		if err != nil || firstInt < 1 {
			firstInt = DefaultFirst // Fallback
		}
		params["first"] = firstInt

		if lastParam, exists := rawParams["last"]; exists {
			lastInt, err := strconv.Atoi(lastParam)
			if err != nil || lastInt < 1 {
				delete(rawParams, "last") // Ungültige Werte entfernen
			} else {
				params["last"] = lastInt
			}
		}

		params["after"] = rawParams["after"]
		params["before"] = rawParams["before"]

		// Avoid invalid combination (first & last simultaneously)
		if _, exists := params["last"]; exists && firstInt != DefaultFirst {
			delete(params, "last")
		}
	}

	// Check additional parameters and add them if they are valid
	for key, validValues := range additionalParams {
		if value, exists := rawParams[key]; exists {
			// Check on valid values, only add those which are valid
			if _, valid := validValues[value]; valid {
				params[key] = value
			}
		}
	}
	return params
}

func SendGraphQLQuery[T any](endpoint, query, token string, variables map[string]interface{}, islog bool) (*T, error) {
	// log.Printf("SendGraphQLQuery: endpoint=%s, query=%s, token=%s, variables=%v", endpoint, query, token, variables)
	requestBody, err := json.Marshal(GraphQLRequest{Query: query, Variables: variables})
	if err != nil {
		return nil, err
	}
	if islog {
		log.Printf("requestbody=%s", ASCIIToStringFromBytes(requestBody))
	}

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	limit := resp.Header.Get("X-RateLimit-Limit")
	remaining := resp.Header.Get("X-RateLimit-Remaining")
	reset := resp.Header.Get("X-RateLimit-Reset")

	log.Printf("[GitHub GraphQL] Remaining: %s / %s | Reset at: %s", remaining, limit, reset)

	// Read answer
	body, err := io.ReadAll(resp.Body)
	if islog {
		log.Printf("body=%s", ASCIIToStringFromBytes(body))
	}
	if err != nil {
		return nil, err
	}

	// JSON decoding in generic structure
	var result T
	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, err
	}
	if islog {
		log.Printf("result=%v", result)
	}
	return &result, nil
}
