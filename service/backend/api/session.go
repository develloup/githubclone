package api

import (
	"context"
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"log"
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

var sessionUsers = make(map[string]map[string]string)
var sessionTokens = make(map[string]map[string]string)
var sessionURLs = make(map[string]map[string]string)
var oauthConfigMap = make(map[string]map[string]*oauth2.Config)
var oauthConfigMutex sync.Mutex

var baseURL = os.Getenv("BACKEND_URL")

func IsValidSession(sessionID string) bool {
	log.Printf("IsValidSession: \"%s\"", sessionID)
	if sessionID == "" {
		return false
	}
	oauthConfigMutex.Lock()
	_, exists := sessionUsers[sessionID]
	oauthConfigMutex.Unlock()
	log.Printf("exists=%t, sessionUsers: %v", exists, sessionUsers)
	return exists
}

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
	// Check the base URL
	if baseURL == "" {
		return nil, fmt.Errorf("baseURL is not set")
	}

	var config *oauth2.Config

	switch serviceType {
	case "github":
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/github", baseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint:     github.Endpoint,
		}
	case "github_enterprise":
		// Check if the url is set, other it's not possible to work with a github enterprise server
		if ghesURL == nil || *ghesURL == "" {
			return nil, fmt.Errorf("GitHub Enterprise URL is required but not provided")
		}
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/github_enterprise", baseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("%s/login/oauth/authorize", *ghesURL),
				TokenURL: fmt.Sprintf("%s/login/oauth/access_token", *ghesURL),
			},
		}
	case "gitlab":
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/gitlab", baseURL),
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
		Identifier string `json:"identifier"`
		Password   string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	var user models.User
	if err := db.DB.Where("email = ? OR username = ?", request.Identifier, request.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}

	var userConnections []models.Connection
	if err := db.DB.Model(&user).Association("Connections").Find(&userConnections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user connections"})
		return
	}

	oauthConfigMutex.Lock()
	sessionID := uuid.New().String()

	sessionUsers[sessionID] = map[string]string{
		"id":       fmt.Sprintf("%d", user.ID),
		"username": user.Username,
		"email":    user.Email,
	}
	sessionTokens[sessionID] = make(map[string]string)
	oauthConfigMap[sessionID] = make(map[string]*oauth2.Config)
	for _, connection := range userConnections {
		config, err := getOAuth2Config(connection.ClientID, connection.ClientSecret, connection.Type, connection.URL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth2 configuration failed"})
			oauthConfigMutex.Unlock()
			return
		}
		oauthConfigMap[sessionID][connection.Type] = config
	}

	loginURLs := make(map[string]string)
	for _, connection := range userConnections {
		loginURLs[connection.Type] = fmt.Sprintf("%s/api/login/%s?state=%s", baseURL, connection.Type, sessionID)
	}
	sessionURLs[sessionID] = loginURLs
	oauthConfigMutex.Unlock()

	// log.Printf("================== Login")
	c.SetCookie("session_id", sessionID, 3600, "/", "", false, true)

	// log.Printf("SessionID: %s", sessionID)
	// log.Printf("LoginURLs: %s", loginURLs)
	// log.Printf("sessionsUsers: %v", sessionUsers)
	// log.Printf("oauthConfigMap: %v", oauthConfigMap)

	c.JSON(http.StatusOK, gin.H{
		"message":          "Login successful, please authenticate via OAuth2",
		"oauth_login_urls": loginURLs,
	})
}

func Logout(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}

	delete(sessionUsers, sessionID)
	delete(sessionTokens, sessionID)
	delete(sessionURLs, sessionID)

	c.SetCookie("session_id", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func LoginProvider(c *gin.Context) {
	provider := c.Param("provider")
	sessionID := c.Query("state")

	// log.Printf("================== LoginProvider")
	// log.Printf("Provider:  %s", provider)
	// log.Printf("SessionID: %s", sessionID)

	oauthConfigMutex.Lock()
	config, exists := oauthConfigMap[sessionID][provider]
	oauthConfigMutex.Unlock()

	// log.Printf("oauthConfigMap: %v", oauthConfigMap)

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No OAuth2 config found for this session"})
		return
	}

	url := config.AuthCodeURL(sessionID)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func CallbackProvider(c *gin.Context) {
	provider := c.Param("provider")
	sessionID := c.Query("state")
	code := c.Query("code")

	if code == "" || sessionID == "" {
		c.Redirect(http.StatusFound, "/login?error=OAuth failed")
		return
	}

	// log.Printf("================== CallbackProvider")
	// log.Printf("Provider:  %s", provider)
	// log.Printf("SessionID: %s", sessionID)

	oauthConfigMutex.Lock()
	config, exists := oauthConfigMap[sessionID][provider]
	oauthConfigMutex.Unlock()

	// log.Printf("oauthConfigMap: %v", oauthConfigMap)

	if !exists {
		c.Redirect(http.StatusFound, "/login?error=Invalid provider")
		return
	}

	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=Token exchange failed")
		return
	}

	oauthConfigMutex.Lock()
	if _, ok := sessionTokens[sessionID]; !ok {
		sessionTokens[sessionID] = make(map[string]string)
	}
	sessionTokens[sessionID][provider] = token.AccessToken
	oauthConfigMutex.Unlock()

	// log.Printf("Update sessionTokens[%s][%s] with %s", sessionID, provider, token.AccessToken)

	c.Redirect(http.StatusSeeOther, "/")
}

func GetOAuthStatus(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	// log.Printf("================== GetOAuthStatus")
	// log.Printf("SessionID: %s", sessionID)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}

	oauthConfigMutex.Lock()
	token, exists := sessionTokens[sessionID]
	oauthConfigMutex.Unlock()
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}
	status := make(map[string]bool)
	// log.Printf("sessionTokens: %v", sessionTokens)
	for key, value := range token {
		status[key] = value != ""
	}

	// log.Printf("Status: %v", status)
	c.JSON(http.StatusOK, status)
}

func GetOAuthURLs(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	// log.Printf("================== GetOAuthURLs")
	// log.Printf("SessionID: %s", sessionID)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}

	urls, exists := sessionURLs[sessionID]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	// log.Printf("sessionURLs: %v", sessionURLs)
	// log.Printf("URLs: %v", urls)
	c.JSON(http.StatusOK, urls)
}

func GetLoggedInUser(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}

	user, exists := sessionUsers[sessionID]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}

	// log.Printf("SessionID: %s", sessionID)
	// log.Printf("User: %s", user)

	c.JSON(http.StatusOK, user)
}

func UseToken(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}
	provider := c.Param("provider")
	token, exists := sessionTokens[sessionID][provider]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No access token found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Using token", "provider": provider, "token": token})
}

func SessionRoutes(r *gin.Engine) {
	r.POST("/api/login", Login)
	r.POST("/api/logout", Logout)
	r.GET("/api/oauth-status", GetOAuthStatus)
	r.GET("/api/oauth-urls", GetOAuthURLs)
	r.GET("/api/callback/:provider", CallbackProvider)
	r.GET("/api/login/:provider", LoginProvider)
	r.GET("/api/loggedinuser", GetLoggedInUser)
	r.GET("/api/token/:provider", UseToken)
}
