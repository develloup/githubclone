package config

import (
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
)

var AllowedKeys = map[string]string{
	"password_expiry_days":   "90",
	"password_never_expires": "false",
	"max_login_attempts":     "5",
	"session_timeout":        "30",
}

func SetConfiguration(key, value string) error {
	if _, exists := AllowedKeys[key]; !exists {
		return fmt.Errorf("invalid configuration key: %s", key)
	}

	var existingConfig models.Configuration
	if err := db.DB.First(&existingConfig, "key = ?", key).Error; err == nil {
		existingConfig.Value = value
		return db.DB.Save(&existingConfig).Error
	}

	return db.DB.Create(&models.Configuration{Key: key, Value: value}).Error
}

func GetConfiguration(key string) (string, error) {
	if _, exists := AllowedKeys[key]; !exists {
		return "", fmt.Errorf("invalid configuration key: %s", key)
	}

	var config models.Configuration
	if err := db.DB.First(&config, "key = ?", key).Error; err == nil {
		return config.Value, nil
	}
	return AllowedKeys[key], nil
}
