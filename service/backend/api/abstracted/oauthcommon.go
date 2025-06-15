package abstracted

import (
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetOAuthCommonProvider[T any](c *gin.Context, provider string, gql string, validParams map[string]interface{}, islog bool) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID found in cookie"})
		return
	}
	session, err := api.GetToken(sessionID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err})
		return
	}
	if value, ok := session[api.OAuthProvider(provider)]; ok {
		switch api.OAuthProvider(provider) {
		case api.GHES, api.Github:
			userdata := make(map[string]interface{})
			endpoint := value.URL
			token := value.Token
			if islog {
				log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			}
			githubData, err := common.SendGraphQLQuery[any](
				graphqlgithubprefix+endpoint+graphqlgithubpath,
				gql,
				token,
				validParams,
				islog,
			)
			if islog {
				log.Printf("githubdata=%v, err=%v", githubData, err)
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			// You're able to manipulate the data here or put it in the cache.
			userdata[string(api.Github)] = githubData
			c.JSON(http.StatusOK, userdata)
		case api.Gitlab:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": provider})
			return
		}

	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": provider})
		return
	}
}

func GetOAuthCommonProviderREST[T any](
	c *gin.Context, provider string, validParams map[string]interface{},
	fn func(endpoint, token string, params map[string]interface{}, islog bool) (*T, error),
	islog bool) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID found in cookie"})
		return
	}
	session, err := api.GetToken(sessionID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err})
		return
	}
	if value, ok := session[api.OAuthProvider(provider)]; ok {
		switch api.OAuthProvider(provider) {
		case api.GHES, api.Github:
			userdata := make(map[string]interface{})
			endpoint := value.URL
			token := value.Token
			if islog {
				log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			}
			githubData, err := fn(
				restapigithubprefix+endpoint+restapigithubpath,
				token,
				validParams,
				islog,
			)
			if islog {
				log.Printf("githubdata=%v, err=%v", githubData, err)
			}
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "REST API request failed", "details": err.Error()})
				return
			}
			// You're able to manipulate the data here or put it in the cache.
			userdata[string(api.Github)] = githubData
			c.JSON(http.StatusOK, userdata)

		case api.Gitlab:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": provider})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": provider})
		return
	}
}
