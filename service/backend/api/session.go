package api

import (
	"context"
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/gitlab"
)

var oauthConfigMap = make(map[string]map[string]*oauth2.Config)
var oauthTokenChannels = make(map[string]chan string)
var oauthConfigMutex sync.Mutex
var baseURL = os.Getenv("BASE_URL")

func GenerateJWT(userID uint, tokens map[string]string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     expirationTime.Unix(),
		"tokens":  tokens, // Speichert die OAuth2-Zugriffstokens
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(os.Getenv("SECRET_KEY")))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func getOAuth2Config(clientID, clientSecret, serviceType string, ghesURL *string) (*oauth2.Config, error) {
	var config *oauth2.Config

	switch serviceType {
	case "github":
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/callback/github", baseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint:     github.Endpoint,
		}
	case "github_enterprise":
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/callback/github_enterprise", baseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("%s/login/oauth/authorize", ghesURL),
				TokenURL: fmt.Sprintf("%s/login/oauth/access_token", ghesURL),
			},
		}
	case "gitlab":
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/callback/gitlab", baseURL),
			Scopes:       []string{"read_user", "api"},
			Endpoint:     gitlab.Endpoint,
		}
	default:
		return nil, fmt.Errorf("unsupported service type: %s", serviceType)
	}
	return config, nil
}

func Login(c *gin.Context) {
	var request struct {
		Identifier string `json:"identifier"` // Kann E-Mail ODER Username sein
		Password   string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ? OR username = ?", request.Identifier, request.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/email or password"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/email or password"})
		return
	}

	var userConnections []models.Connection
	if err := db.DB.Model(&user).Association("Connections").Find(&userConnections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user connections"})
		return
	}

	sessionID := uuid.New().String()
	oauthConfigMutex.Lock()
	oauthConfigMap[sessionID] = make(map[string]*oauth2.Config)
	for _, connection := range userConnections {
		oauthConfigMap[sessionID][connection.Type], _ = getOAuth2Config(connection.ClientID, connection.ClientSecret, connection.Type, connection.URL)
	}
	oauthConfigMutex.Unlock()

	// Generiere die OAuth2-Login-URLs
	loginURLs := make(map[string]string)
	for _, connection := range userConnections {
		loginURLs[connection.Type] = fmt.Sprintf("%s/login/%s?state=%s", baseURL, connection.Type, sessionID)
	}

	// Antwort an das Frontend mit den OAuth2-Login-Links
	c.JSON(http.StatusOK, gin.H{
		"message":          "Login successful, please authenticate via OAuth2",
		"session_id":       sessionID,
		"oauth_login_urls": loginURLs,
	})
}

func Logout(c *gin.Context) {
}

func LoginProvider(c *gin.Context) {
	provider := c.Param("provider")
	sessionID := c.Query("state")

	oauthConfigMutex.Lock()
	config, exists := oauthConfigMap[sessionID][provider]
	oauthConfigMutex.Unlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No OAuth2 config found for this session"})
		return
	}

	url := config.AuthCodeURL(sessionID)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func CallbackProvider(c *gin.Context) {
	provider := c.Param("provider")
	sessionID := c.Query("state") // Session-ID aus der URL holen
	code := c.Query("code")

	if code == "" || sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code or session ID missing"})
		return
	}

	oauthConfigMutex.Lock()
	config, exists := oauthConfigMap[sessionID][provider]
	oauthConfigMutex.Unlock()

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No OAuth2 config found for this session"})
		return
	}

	// Tausche den Code gegen das Access-Token
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token exchange failed"})
		return
	}

	// Token an den richtigen Channel senden
	oauthConfigMutex.Lock()
	if tokenChannel, exists := oauthTokenChannels[sessionID]; exists {
		tokenChannel <- token.AccessToken
		delete(oauthTokenChannels, sessionID) // Nach Nutzung entfernen
	}
	oauthConfigMutex.Unlock()

	c.JSON(http.StatusOK, gin.H{"access_token": token})
}

func SessionRoutes(r *gin.Engine) {
	r.POST("/api/login", Login)
	r.POST("/api/logout", Logout)
	r.GET("/callback/:provider", CallbackProvider)
	r.GET("/login/:provider", LoginProvider)
}
