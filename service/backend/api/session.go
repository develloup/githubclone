package api

import (
	"encoding/json"
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

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
func GetOAuth2Token(clientID, clientSecret, serviceType string) (string, error) {
	var tokenURL string

	switch serviceType {
	case "github":
		tokenURL = "https://github.com/login/oauth/access_token"
	case "gitlab":
		tokenURL = "https://gitlab.com/oauth/token"
	default:
		return "", fmt.Errorf("unsupported connection type: %s", serviceType)
	}

	// API-Request an OAuth2 Provider senden
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("grant_type", "client_credentials")

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.AccessToken, nil
}
func Login(c *gin.Context) {
	var request struct {
		Identifier string `json:"identifier"` // Kann E-Mail ODER Username sein
		Password   string `json:"password"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Benutzer suchen mit E-Mail oder Username
	var user models.User
	if err := db.DB.Where("email = ? OR username = ?", request.Identifier, request.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}

	// Passwort überprüfen
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username/email or password"})
		return
	}

	// **OAuth2-Token für alle Connections abrufen**
	var userConnections []models.Connection
	if err := db.DB.Model(&user).Association("Connections").Find(&userConnections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user connections"})
		return
	}

	tokens := make(map[string]string) // Map für gespeicherte Tokens
	for _, connection := range userConnections {
		// Token über OAuth2 abrufen
		token, err := GetOAuth2Token(connection.ClientID, connection.ClientSecret, connection.Type)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to retrieve token for %s", connection.ConnectionName)})
			return
		}
		tokens[connection.Type] = token // Token speichern
	}

	// **Session-Token mit gespeicherten Zugriffstokens erzeugen**
	tokenString, err := GenerateJWT(user.ID, tokens)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate session token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful", "token": tokenString})
}

func Logout(c *gin.Context) {

}

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

func LoginProvider(c *gin.Context) {
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
}

func CallbackProvider(c *gin.Context) {
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
}

func SessionRoutes(r *gin.Engine) {
	r.POST("/login", Login)
	r.POST("/logout", Logout)
	r.GET("/callback/:provider", CallbackProvider)
	r.GET("/login/:provider", LoginProvider)
}
