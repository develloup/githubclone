package tests

import (
	"net/http"
	"testing"
)

func TestGetConfig(t *testing.T) {
	resp, err := GetRequest("/config/password_expiry_days")

	if err != nil {
		t.Fatalf("Fehler beim API-Call: %s", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Erwarteter Status 200, aber bekommen %d", resp.StatusCode)
	}
}
