package main

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/abstracted"
	"githubclone-backend/db"
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	logFile, err := os.OpenFile("/var/log/githubclone/githubclone.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("error during opening/creation of log file: %v", err)
	}

	port := os.Getenv("BACKEND_PORT")
	baseURL := os.Getenv("BACKEND_URL")

	// Multi-Writer for stdout, stderr and file
	multiWriter := io.MultiWriter(os.Stderr, logFile)

	// Set the output of the log
	log.SetOutput(multiWriter)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	fileLogger := log.New(logFile, "", log.Ldate|log.Ltime|log.Lshortfile)
	fileLogger.Printf("============================== New Session starts ==============================")

	// Initialize the database connection
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
	api.ConnectionRoutes(r)
	api.UserConnectionRoutes(r)
	api.ConfigurationRoutes(r)
	abstracted.SetupRoutes(r)
	// frontend.Routes(r)

	// React on shutting down via ^C
	sigs := make(chan os.Signal, 1) // Catches CTRL+C
	signal.Notify(sigs, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-sigs
		log.Printf("Backend is shutting down: %v\n", sig)
		os.Exit(0)
	}()

	defer logFile.Close()
	log.Printf("The backend is setup with port: %s. The frontend tries to reach the backend with this URL: %s", port, baseURL)
	r.Run(fmt.Sprintf("0.0.0.0:%s", port))
}
