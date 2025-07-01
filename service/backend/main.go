package main

import (
	"context"
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/abstracted"
	"githubclone-backend/cachable"
	"githubclone-backend/cache"
	"githubclone-backend/db"
	"githubclone-backend/restore"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func CacheMiddleware(facade *cachable.CacheFacade) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("cacheFacade", facade)
		c.Next()
	}
}

func main() {
	logFile, err := os.OpenFile("/var/log/githubclone/githubclone.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("error during opening/creation of log file: %v", err)
	}
	defer logFile.Close()

	port := os.Getenv("BACKEND_PORT")
	baseURL := os.Getenv("BACKEND_URL")

	redisAddr := os.Getenv("REDIS_HOST")

	multiWriter := io.MultiWriter(os.Stderr, logFile)
	log.SetOutput(multiWriter)
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)

	fileLogger := log.New(logFile, "", log.Ldate|log.Ltime|log.Lshortfile)
	fileLogger.Printf("============================== New Session starts ==============================")

	// Initialize the database connection
	db.InitDB()
	db.AutoMigrate()

	ctx := context.Background()
	mlc, err := cache.NewMultiLevelCache(redisAddr, time.Minute)
	if err != nil {
		log.Fatalf("Cache init failed: %v", err)
	}
	facade := cachable.NewCacheFacade(ctx, mlc)

	// Gin-Engine
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	if err := r.SetTrustedProxies(nil); err != nil {
		log.Printf("Cannot set trusted proxies: %v", err)
	}

	// Set up middleware for all routines which come after this setup
	r.Use(CacheMiddleware(facade))

	// Routes
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	api.UserRoutes(r)
	api.SessionRoutes(r)
	api.ConnectionRoutes(r)
	api.UserConnectionRoutes(r)
	api.ConfigurationRoutes(r)
	abstracted.SetupRoutes(r)

	// Configure HTTP-Server
	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", port),
		Handler: r,
	}

	// Restore values from database, so that the service is able to continue as if the server were never down
	// TODO: implement in cache
	restore.InitRestore()

	// Start server in go routine
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server startup error: %v", err)
		}
	}()
	log.Printf("The backend is setup with port: %s. The frontend tries to reach the backend with this URL: %s", port, baseURL)

	// Catch signal for shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	sig := <-quit
	log.Printf("Backend is shutting down: %v\n", sig)

	if err := mlc.Close(); err != nil {
		log.Printf("Error during redis-shutdown: %v", err)
	}
	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Optional: db.Close(), cache.Flush(), logger.Sync() etc.
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server cleanly shut down")
}
