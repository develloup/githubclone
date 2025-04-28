package main

import (
	"githubclone-backend/db"
	"githubclone-backend/models"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

var githubOAuth = &oauth2.Config{
	ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
	ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
	RedirectURL:  "http://localhost:8080/callback/github",
	Scopes:       []string{"repo", "user"},
	Endpoint:     github.Endpoint,
}

var githubEnterpriseOAuth = &oauth2.Config{
	ClientID:     os.Getenv("GHE_CLIENT_ID"),
	ClientSecret: os.Getenv("GHE_CLIENT_SECRET"),
	RedirectURL:  "http://localhost:8080/callback/github_enterprise",
	Scopes:       []string{"repo", "user"},
	Endpoint: oauth2.Endpoint{
		AuthURL:  "https://github.seeyou.com/login/oauth/authorize",
		TokenURL: "https://github.seeyou.com/login/oauth/access_token",
	},
}

var gitlabOAuth = &oauth2.Config{
	ClientID:     os.Getenv("GITLAB_CLIENT_ID"),
	ClientSecret: os.Getenv("GITLAB_CLIENT_SECRET"),
	RedirectURL:  "http://localhost:8080/callback/gitlab",
	Scopes:       []string{"read_user", "api"},
	Endpoint: oauth2.Endpoint{
		AuthURL:  "https://gitlab.com/oauth/authorize",
		TokenURL: "https://gitlab.com/oauth/token",
	},
}

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

	r.GET("/login/:provider", func(c *gin.Context) {
		provider := c.Param("provider")

		var config *oauth2.Config
		switch provider {
		case "github":
			config = githubOAuth
		case "github_enterprise":
			config = githubEnterpriseOAuth
		case "gitlab":
			config = gitlabOAuth
		default:
			c.JSON(400, gin.H{"error": "Invalid provider"})
			return
		}

		url := config.AuthCodeURL("state-token")
		c.Redirect(http.StatusTemporaryRedirect, url)
	})

	r.GET("/callback/:provider", func(c *gin.Context) {
		provider := c.Param("provider")

		var config *oauth2.Config
		switch provider {
		case "github":
			config = githubOAuth
		case "github_enterprise":
			config = githubEnterpriseOAuth
		case "gitlab":
			config = gitlabOAuth
		default:
			c.JSON(400, gin.H{"error": "Invalid provider"})
			return
		}

		code := c.Query("code")
		token, err := config.Exchange(c, code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange failed"})
			return
		}

		// Speichere das Token für spätere API-Anfragen
		c.JSON(http.StatusOK, gin.H{"access_token": token.AccessToken})
	})

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/users", func(c *gin.Context) {
		var users []models.User
		db.DB.Find(&users)
		c.JSON(200, users)
	})
	r.Static("/static", "./static")
	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})
	r.NoRoute(func(c *gin.Context) {
		path := "./static" + c.Request.URL.Path
		if _, err := http.Dir("./static").Open(c.Request.URL.Path); err == nil {
			c.File(path) // deliver static file
		} else {
			c.File("./static/index.html") // Next.js takes care of finding illegal pages
		}
	})

	r.Run("0.0.0.0:8080")
}
