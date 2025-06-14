package abstracted

import (
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetOAuthRepositories(c *gin.Context) {
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

	rawParams := map[string]string{
		"first":     c.DefaultQuery("first", strconv.Itoa(common.DefaultFirst)),
		"last":      c.Query("last"),
		"after":     c.Query("after"),
		"before":    c.Query("before"),
		"field":     c.DefaultQuery("field", "UPDATED_AT"),
		"direction": c.DefaultQuery("direction", "DESC"),
	}

	// Validate parameters, only keep the valid ones
	validParams := common.ValidateGraphQLParams(
		true,
		rawParams,
		map[string]map[string]bool{
			"field":     {"NAME": true, "CREATED_AT": true, "UPDATED_AT": true, "STARGAZER_COUNT": true},
			"direction": {"ASC": true, "DESC": true},
		})

	userdata := make(map[string]interface{})
	for key, value := range session {
		switch key {
		case api.Github, api.GHES:
			endpoint := value.URL
			token := value.Token
			log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			githubData, err := common.SendGraphQLQuery[github.GitHubRepositoriesOfViewer](
				graphqlgithubprefix+endpoint+graphqlgithubpath,
				github.GithubRepositoriesOfViewerQuery,
				token,
				validParams,
				false,
			)
			// log.Printf("githubdata=%v, err=%v", githubData, err)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			// You're able to manipulate the data here or put it in the cache.
			userdata[string(api.Github)] = githubData

		case api.Gitlab:
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": key})
			return
		}
	}
	c.JSON(http.StatusOK, userdata)
}

func GetOAuthRepository(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner": c.Query("owner"),
		"name":  c.Query("name"),
	}

	GetOAuthCommonProvider[github.RepositoryNodeWithAttributes](c, provider, github.GithubRepositoryQuery, validParams, false)
}

func GetOauthRepositoryContents(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner":      c.Query("owner"),
		"name":       c.Query("name"),
		"expression": c.DefaultQuery("expression", "HEAD:"),
	}

	GetOAuthCommonProvider[github.RepositoryTree](c, provider, github.GithubRepositoryContentsQuery, validParams, true)
}
