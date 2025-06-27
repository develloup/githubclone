package restore

import "log"

func InitRestore() {
	log.Println("Starting restore operation...")

	if err := RestoreSessions(); err != nil {
		log.Printf("Error restoring sessions: %v", err)
	}
	if err := RestoreOAuth2Sessions(); err != nil {
		log.Printf("Error restoring oauth2 sessions: %v", err)
	}
	log.Println("All restore operations completed.")
}
