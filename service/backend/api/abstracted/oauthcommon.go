package abstracted

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/cache"

	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetOAuthCommonProvider[T any](c *gin.Context, provider string, gql string, validParams map[string]interface{}, cache *cache.TypedCache[T], cacheKey string, islog bool) {
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
			githubData, found, err := cache.Get(cacheKey)
			if err != nil {
				log.Printf("cache read error: %v", err)
			}
			if !found || githubData == nil {
				githubData, err := common.SendGraphQLQuery[T](
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
				if err := cache.Set(cacheKey, *githubData); err != nil {
					log.Printf("cache write error: %v", err)
				}
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

func GetOAuthCommonProviderIntern[T any](c *gin.Context, provider string, gql string, validParams map[string]interface{}, islog bool) (*T, error) {
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		return nil, fmt.Errorf("missing session_id cookie: %w", err)
	}

	session, err := api.GetToken(sessionID)
	if err != nil {
		return nil, fmt.Errorf("token fetch failed: %w", err)
	}

	value, ok := session[api.OAuthProvider(provider)]
	if !ok {
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	switch api.OAuthProvider(provider) {
	case api.GHES, api.Github:
		endpoint := value.URL
		token := value.Token

		if islog {
			log.Printf("GraphQL endpoint: %s", graphqlgithubprefix+endpoint+graphqlgithubpath)
		}

		data, err := common.SendGraphQLQuery[T](
			graphqlgithubprefix+endpoint+graphqlgithubpath,
			gql,
			token,
			validParams,
			islog,
		)
		if err != nil {
			return nil, fmt.Errorf("GraphQL query failed: %w", err)
		}
		return data, nil

	case api.Gitlab:
		return nil, fmt.Errorf("provider %s currently not supported", provider)

	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}

func GetOAuthCommonProviderREST[T any](
	c *gin.Context, provider string, validParams map[string]interface{},
	fn func(endpoint, token string, params map[string]interface{}, islog bool) (*T, error),
	cache *cache.TypedCache[T], cacheKey string,
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

	cachedData, found, err := cache.Get(cacheKey)
	if islog && err == nil {
		log.Printf("Cache hit for %s", cacheKey)
	}
	if found && cachedData != nil && err == nil {
		userdata := make(map[string]interface{})
		userdata[string(api.OAuthProvider(provider))] = cachedData
		c.JSON(http.StatusOK, userdata)
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
			cache.Set(cacheKey, *githubData)
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
