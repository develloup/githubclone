package tests

import (
	"net/http"
	"testing"
)

func TestGetConfig(t *testing.T) {
	resp, err := GetRequest("/api/config/password_expiry_days")

	if err != nil {
		t.Fatalf("Error during api call: %s", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status is 200, but got %d", resp.StatusCode)
	}
}
