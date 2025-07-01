package api

import (
	"context"
	"fmt"
	"githubclone-backend/cachable"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"log"
	"net/http"
	"os"
	"strconv"
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
	connectionID  uint           // The primary key of the connection that is used
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

func RestoreLogin(facade *cachable.CacheFacade, session models.Session) {

	tx := db.DB.Begin() // Start of transaction
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var user models.User
	if err := tx.First(&user, "id = ?", session.UserID).Error; err != nil {
		tx.Delete(&models.Session{ID: session.ID}) // remove the session if user is not available
		tx.Commit()
		return
	}

	var userConnections []models.Connection
	if err := db.DB.Model(&user).Association("Connections").Find(&userConnections); err != nil {
		userConnections = []models.Connection{}
	}

	oauthConfigMutex.Lock()
	sessionID := session.ID

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

	// Extend session
	timeout := 1
	if t, err := facade.GetConfigValue("session_timeout"); err == nil {
		timeout, _ = strconv.Atoi(t) // one hour session timeout as a default
	}
	session.ExpiresAt = time.Now().Add(time.Duration(timeout) * time.Hour)
	log.Printf("Session expires at: %v, timeout: %d", session.ExpiresAt, timeout)
	if err := tx.Save(&session).Error; err != nil {
		tx.Rollback()
		return
	}
	tx.Commit()
	log.Printf("Session %s is restored", sessionID)
}

func Login(c *gin.Context) {
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)

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
		userConnections = []models.Connection{}
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
			connectionID:  connection.ID,
		}
	}
	// copy structure to provide an answer
	loginURLs := make(map[string]string)
	for key, value := range sessionConfig[sessionID].config {
		loginURLs[string(key)] = value.url
	}
	oauthConfigMutex.Unlock()

	timeout := 1
	if t, err := facade.GetConfigValue("session_timeout"); err == nil {
		timeout, _ = strconv.Atoi(t) // one hour session timeout as a default
	}
	session := models.Session{
		ID:        sessionID,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(time.Duration(timeout) * time.Hour),
	}
	log.Printf("Session expires at: %v, timeout is %d", session.ExpiresAt, timeout)

	if err := db.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store session"})
		return
	}

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
	if err != nil || sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No session ID"})
		return
	}

	oauthConfigMutex.Lock()
	delete(sessionConfig, sessionID)
	oauthConfigMutex.Unlock()
	c.SetCookie("session_id", "", -1, "/", "", false, true)
	if err := db.DB.Delete(&models.Session{ID: sessionID}).Error; err != nil {
		log.Printf("Could not delete session: %s", sessionID)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func LoginProvider(c *gin.Context) {
	provider := c.Param("provider")
	sessionID := c.Query("state")

	// TODO: Look at the redirects, they seem to be not working
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

	oauthConfigMutex.Lock()
	providerConfig, exists := sessionConfig[sessionID].config[OAuthProvider(provider)]

	if !exists {
		oauthConfigMutex.Unlock()
		c.Redirect(http.StatusFound, "/login?error=Invalid provider")
		return
	}
	token, err := providerConfig.oauthconfig.Exchange(context.Background(), code)
	if err != nil {
		oauthConfigMutex.Unlock()
		c.Redirect(http.StatusFound, "/login?error=Token exchange failed")
		return
	}
	providerConfig.token = token
	sessionConfig[sessionID].config[OAuthProvider(provider)] = providerConfig
	oauthConfigMutex.Unlock()

	oauth2Session := models.OAuth2Session{
		SessionID:    sessionID,
		ConnectionID: providerConfig.connectionID,
		AccessToken:  token.AccessToken,
		LastSeenAt:   time.Now(),
	}
	// log.Printf("Update sessionTokens[%s][%s] with %s", sessionID, provider, token.AccessToken)
	// log.Printf("AccessToken:  %s", token.AccessToken)
	// log.Printf("TokenType:    %s", token.TokenType)
	if token.RefreshToken != "" {
		// log.Printf("Expiry:       %s", token.Expiry.Format(time.RFC3339))
		// log.Printf("Valid unitl:  %s", time.Until(token.Expiry).Round(time.Second))
		// log.Printf("RefreshToken: %s", token.RefreshToken)
		oauth2Session.RefreshToken = token.RefreshToken
		oauth2Session.ExpiresAt = &token.Expiry
	} else {
		// log.Printf("Token does not expire.")
	}
	err = db.DB.Create(&oauth2Session).Error
	if err != nil {
		c.Redirect(http.StatusFound, "/login?error=Token cannot be stored.")
		return
	}

	r := fmt.Sprintf("%s%s", frontendURL, "/")
	c.Redirect(http.StatusSeeOther, r)
}

func RestoreProvider(oauth2session models.OAuth2Session) {
	oauthConfigMutex.Lock()
	defer oauthConfigMutex.Unlock()

	providerType := OAuthProvider(oauth2session.Connection.Type)
	providerConfig := sessionConfig[oauth2session.SessionID].config[providerType]

	token := oauth2.Token{
		AccessToken:  oauth2session.AccessToken,
		RefreshToken: oauth2session.RefreshToken,
	}
	if oauth2session.ExpiresAt != nil {
		token.Expiry = *oauth2session.ExpiresAt
	}
	if oauth2session.ExpiresAt != nil &&
		oauth2session.ExpiresAt.Before(time.Now()) &&
		oauth2session.RefreshToken != "" &&
		providerConfig.oauthconfig != nil {
		ctx := context.Background()
		tokenSource := providerConfig.oauthconfig.TokenSource(ctx, &token)
		newToken, err := tokenSource.Token()
		if err != nil {
			log.Printf("Renewal with refresh token failed: %v", err)
			if err := db.DB.Delete(&oauth2session).Error; err != nil {
				log.Printf("Could not remove oauth2session from db: %v", err)
			}
			return
		}
		token = *newToken
		var expiresAtPtr *time.Time
		if !newToken.Expiry.IsZero() {
			exp := newToken.Expiry
			expiresAtPtr = &exp
		}

		db.DB.Model(&oauth2session).Updates(models.OAuth2Session{
			AccessToken:  newToken.AccessToken,
			RefreshToken: newToken.RefreshToken,
			ExpiresAt:    expiresAtPtr,
			LastSeenAt:   time.Now(),
		})
	}

	providerConfig.token = &token
	sessionConfig[oauth2session.SessionID].config[providerType] = providerConfig
	log.Printf("OAuth2Session %s restored", oauth2session.Connection.Type)
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
