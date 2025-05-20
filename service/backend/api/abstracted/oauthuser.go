package abstracted

import (
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/api/gitlab"
	"log"

	"net/http"

	"github.com/gin-gonic/gin"
)

const graphqlgithubprefix = "https://api."
const graphqlgithubpath = "/graphql"
const graphqlgitlabprefix = "https://"
const graphqlgitlabpath = "/api/graphql"

func GetOAuthUser(c *gin.Context) {
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
	userdata := make(map[string]interface{})
	log.Printf("session=%v", session)
	for key, value := range session {
		log.Printf("key=%v, value=%v", key, value)
		switch key {
		case api.Github, api.GHES:
			log.Printf("github found")
			endpoint := value.URL
			token := value.Token
			log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			githubData, err := common.SendGraphQLQuery[github.GitHubUser](graphqlgithubprefix+endpoint+graphqlgithubpath, github.GithubUserQuery, token, nil)
			log.Printf("githubdata=%v, err=%v", githubData, err)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			userdata[string(api.Github)] = githubData
		case api.Gitlab:
			log.Printf("gitlab found")
			endpoint := value.URL
			token := value.Token
			log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			gitlabData, err := common.SendGraphQLQuery[gitlab.GitLabUser](graphqlgitlabprefix+endpoint+graphqlgitlabpath, gitlab.GitLabUserQuery, token, nil)
			log.Printf("gitlabdata=%v, err=%v", gitlabData, err)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			userdata[string(api.Gitlab)] = gitlabData
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": key})
			return
		}
	}

	// Return feedback as json
	log.Printf("Userdata=%v", userdata)
	c.JSON(http.StatusOK, userdata)
}
