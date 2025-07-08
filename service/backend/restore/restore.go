package restore

import (
	"githubclone-backend/cachable"
	"log"
)

func InitRestore(facade *cachable.CacheFacade) {
	log.Println("Starting restore operation...")

	if err := RestoreSessions(facade); err != nil {
		log.Printf("Error restoring sessions: %v", err)
	}
	if err := RestoreOAuth2Sessions(); err != nil {
		log.Printf("Error restoring oauth2 sessions: %v", err)
	}
	log.Println("All restore operations completed.")
}
