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

var baseURL = os.Getenv("BACKEND_URL")
var internBaseURL = os.Getenv("INTERN_BACKEND_URL")
var frontendURL = os.Getenv("FRONTEND_URL")

type OAuthProvider string

const (
	Github OAuthProvider = "github"
	Gitlab OAuthProvider = "gitlab"
	GHES   OAuthProvider = "github_enterprise"
)

var (
	GithubAddress string = "github.com"
	GitlabAddress string = "gitlab.com"
)

type OAuthProviderType struct {
	token         *oauth2.Token  // token of the session for a provider
	url           string         // urls of the session for a provider
	oauthconfig   *oauth2.Config // the oauth2 configuration values of the sessionf or a provider
	connectionURL *string        // The connection URL to a ghes instance
}

type OAuthConfig struct {
	user   map[string]string // user of the session
	config map[OAuthProvider]OAuthProviderType
}

type AccessToken struct {
	Token string
	URL   string
}

var sessionConfig = make(map[string]OAuthConfig)
var oauthConfigMutex sync.Mutex

var OAuthProviderURL = map[OAuthProvider]*string{
	Github: &GithubAddress,
	Gitlab: &GitlabAddress,
	GHES:   nil,
}

func IsValidSession(sessionID string) bool {
	// log.Printf("IsValidSession: \"%s\"", sessionID)
	if sessionID == "" {
		return false
	}
	oauthConfigMutex.Lock()
	_, exists := sessionConfig[sessionID]
	oauthConfigMutex.Unlock()
	// log.Printf("exists=%t, sessionUsers: %v", exists, sessionConfig)
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

func getOAuth2Config(clientID, clientSecret string, serviceType OAuthProvider, ghesURL *string) (*oauth2.Config, error) {
	// Check the base URL
	if baseURL == "" {
		return nil, fmt.Errorf("baseURL is not set")
	}

	var config *oauth2.Config

	switch serviceType {
	case Github:
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/github", internBaseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint:     github.Endpoint,
		}
	case GHES:
		// Check if the url is set, other it's not possible to work with a github enterprise server
		if ghesURL == nil || *ghesURL == "" {
			return nil, fmt.Errorf("GitHub Enterprise URL is required but not provided")
		}
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/github_enterprise", internBaseURL),
			Scopes:       []string{"repo", "user"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("%s/login/oauth/authorize", *ghesURL),
				TokenURL: fmt.Sprintf("%s/login/oauth/access_token", *ghesURL),
			},
		}
	case Gitlab:
		config = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  fmt.Sprintf("%s/api/callback/gitlab", internBaseURL),
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

	sessionConfig[sessionID] = OAuthConfig{
		user: map[string]string{
			"id":       fmt.Sprintf("%d", user.ID),
			"username": user.Username,
			"email":    user.Email,
		},
		config: map[OAuthProvider]OAuthProviderType{},
	}

	for _, connection := range userConnections {
		config, err := getOAuth2Config(connection.ClientID, connection.ClientSecret, OAuthProvider(connection.Type), connection.URL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth2 configuration failed"})
			oauthConfigMutex.Unlock()
			return
		}
		sessionConfig[sessionID].config[OAuthProvider(connection.Type)] = OAuthProviderType{
			token:         nil,
			url:           fmt.Sprintf("%s/api/login/%s?state=%s", internBaseURL, connection.Type, sessionID),
			oauthconfig:   config,
			connectionURL: connection.URL,
		}
	}
	// copy structure to provide an answer
	loginURLs := make(map[string]string)
	for key, value := range sessionConfig[sessionID].config {
		loginURLs[string(key)] = value.url
	}
	oauthConfigMutex.Unlock()

	// log.Printf("================== Login")
	c.SetCookie("session_id", sessionID, 3600, "/", "", false, true)

	// log.Printf("oauthConfigMap: %v", sessionConfig)

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

	oauthConfigMutex.Lock()
	delete(sessionConfig, sessionID)
	oauthConfigMutex.Unlock()
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
	config, exists := sessionConfig[sessionID].config[OAuthProvider(provider)]
	oauthConfigMutex.Unlock()

	// log.Printf("oauthConfigMap: %v", sessionConfig)

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No OAuth2 config found for this session"})
		return
	}

	url := config.oauthconfig.AuthCodeURL(sessionID)
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
	config, exists := sessionConfig[sessionID].config[OAuthProvider(provider)]

	// log.Printf("sessionConfig: %v", sessionConfig)

	if !exists {
		oauthConfigMutex.Unlock()
		c.Redirect(http.StatusFound, "/login?error=Invalid provider")
		return
	}

	token, err := config.oauthconfig.Exchange(context.Background(), code)
	if err != nil {
		oauthConfigMutex.Unlock()
		c.Redirect(http.StatusFound, "/login?error=Token exchange failed")
		return
	}

	providerConfig := sessionConfig[sessionID].config[OAuthProvider(provider)]
	providerConfig.token = token
	sessionConfig[sessionID].config[OAuthProvider(provider)] = providerConfig
	oauthConfigMutex.Unlock()

	// log.Printf("Update sessionTokens[%s][%s] with %s", sessionID, provider, token.AccessToken)
	log.Printf("AccessToken:  %s", token.AccessToken)
	log.Printf("TokenType:    %s", token.TokenType)
	if token.RefreshToken != "" {
		log.Printf("Expiry:       %s", token.Expiry.Format(time.RFC3339))
		log.Printf("Valid unitl:  %s", time.Until(token.Expiry).Round(time.Second))
		log.Printf("RefreshToken: %s", token.RefreshToken)
	} else {
		log.Printf("Token does not expire.")
	}

	r := fmt.Sprintf("%s%s", frontendURL, "/")
	c.Redirect(http.StatusSeeOther, r)
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
	session, exists := sessionConfig[sessionID]
	if !exists {
		oauthConfigMutex.Unlock()
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		return
	}
	status := make(map[string]bool)
	// log.Printf("sessionConfig: %v", sessionConfig[sessionID])
	for key, value := range session.config {
		if value.token != nil {
			status[string(key)] = value.token.AccessToken != ""
		}
	}
	oauthConfigMutex.Unlock()

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

	oauthConfigMutex.Lock()
	result, exists := sessionConfig[sessionID]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		oauthConfigMutex.Unlock()
		return
	}
	// copy structure to provide an answer
	loginURLs := make(map[string]string)
	for key, value := range result.config {
		loginURLs[string(key)] = value.url
	}
	oauthConfigMutex.Unlock()

	// log.Printf("URLs: %v", loginURLs)
	c.JSON(http.StatusOK, loginURLs)
}

func GetLoggedInUser(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID"})
		return
	}

	oauthConfigMutex.Lock()
	result, exists := sessionConfig[sessionID]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session"})
		oauthConfigMutex.Unlock()
		return
	}
	user := make(map[string]string)
	for key, value := range result.user {
		user[key] = value
	}
	oauthConfigMutex.Unlock()

	// log.Printf("SessionID: %s", sessionID)
	// log.Printf("User: %s", user)

	c.JSON(http.StatusOK, user)
}

func GetToken(sessionID string) (map[OAuthProvider]AccessToken, error) {
	oauthConfigMutex.Lock()
	result, exists := sessionConfig[sessionID]
	if !exists {
		oauthConfigMutex.Unlock()
		return nil, fmt.Errorf("the session %s is not known", sessionID)
	}
	// log.Printf("sessionID=%s, sessionConfig=%v", sessionID, result)
	at := make(map[OAuthProvider]AccessToken)

	for key, value := range result.config {
		// log.Printf("key=%v, value=%v", key, value)
		u := ""
		switch key {
		case Github:
			u = GithubAddress
		case Gitlab:
			u = GitlabAddress
		case GHES:
			if value.connectionURL != nil {
				u = *value.connectionURL
			}
		default:
			u = ""
		}
		if u == "" {
			oauthConfigMutex.Unlock()
			return nil, fmt.Errorf("the URL for the provider %s is missing", key)
		}
		if value.token != nil {
			at[key] = AccessToken{
				Token: value.token.AccessToken,
				URL:   u,
			}
		}
	}
	oauthConfigMutex.Unlock()
	// log.Printf("AccessToken=%v", at)
	return at, nil
}

func SessionRoutes(r *gin.Engine) {
	r.POST("/api/login", Login)
	r.POST("/api/logout", Logout)
	r.GET("/api/oauth-status", GetOAuthStatus)
	r.GET("/api/oauth-urls", GetOAuthURLs)
	r.GET("/api/callback/:provider", CallbackProvider)
	r.GET("/api/login/:provider", LoginProvider)
	r.GET("/api/loggedinuser", GetLoggedInUser)
}
