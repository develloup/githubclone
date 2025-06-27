package restore

import (
	"githubclone-backend/api"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"log"
	"time"
)

func RestoreSessions() error {
	var sessions []models.Session

	if err := db.DB.
		Where("expires_at <= ?", time.Now()).
		Delete(&models.Session{}).Error; err != nil {
		log.Printf("Session delete error.")
	}
	if err := db.DB.Where("expires_at > ?", time.Now()).Find(&sessions).Error; err != nil {
		return err
	}
	log.Printf("Sessions found: %d", len(sessions))
	for _, sess := range sessions {
		api.RestoreLogin(sess)
	}
	return nil
}

func RestoreOAuth2Sessions() error {
	var oauth2sessions []models.OAuth2Session

	if err := db.DB.Preload("Session").Preload("Connection").Find(&oauth2sessions).Error; err != nil {
		return err
	}

	log.Printf("OAuth2sessions found: %d", len(oauth2sessions))
	for _, oauth2session := range oauth2sessions {
		api.RestoreProvider(oauth2session)
	}
	return nil
}
