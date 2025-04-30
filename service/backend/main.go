package main

import (
	"githubclone-backend/api"
	"githubclone-backend/db"
	"githubclone-backend/frontend"
	"io"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	logFile, err := os.OpenFile("githubclone.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Fehler beim Öffnen/Erstellen der Log-Datei: %v", err)
	}
	defer logFile.Close()

	// Multi-Writer für stdout, stderr und Datei
	multiWriter := io.MultiWriter(os.Stdout, os.Stderr, logFile)

	// Setze die Ausgabe des log-Pakets
	log.SetOutput(multiWriter)
	db.InitDB()
	db.AutoMigrate()

	r := gin.New()        // Create an engine with a middleware
	r.Use(gin.Logger())   // Add a logger
	r.Use(gin.Recovery()) // Add recovery
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Printf("Cannot set trusted proxies: %v", err)
	}

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	api.UserRoutes(r)
	api.SessionRoutes(r)
	frontend.Routes(r)

	r.Run("0.0.0.0:8080")
}
