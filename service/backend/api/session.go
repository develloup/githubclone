package api

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

func Login(c *gin.Context) {

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
