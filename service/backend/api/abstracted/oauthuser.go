package abstracted

import (
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/api/gitlab"

	"net/http"

	"github.com/gin-gonic/gin"
)

const graphqlgithubprefix = "https://api."
const graphqlgithubpath = "/graphql"
const graphqlgitlabprefix = "https://"
const graphqlgitlabpath = "/api/graphql"
const graphqlghesprefix = "https://"
const graphqlghespath = "/api/graphql"

const restapigithubprefix = "https://api."
const restapigithubpath = ""
const restapigitlabprefix = "https://"
const restapigitlabpath = "/api/v4"
const restapighesprefix = "https://"
const restapighespath = "/api/v3"

const githuburl = "https://github.com"
const gitlaburl = "https://gitlab.com"

func convertGitLabToGitHub(gitlabUser gitlab.GitLabUser) github.GitHubUser {
	return github.GitHubUser{
		Data: struct {
			Viewer struct {
				Login      string `json:"login"`
				Name       string `json:"name"`
				Email      string `json:"email"`
				Bio        string `json:"bio"`
				AvatarURL  string `json:"avatarUrl"`
				CreatedAt  string `json:"createdAt"`
				Company    string `json:"company"`
				Location   string `json:"location"`
				WebsiteURL string `json:"websiteUrl"`
			} `json:"viewer"`
		}{
			Viewer: struct {
				Login      string `json:"login"`
				Name       string `json:"name"`
				Email      string `json:"email"`
				Bio        string `json:"bio"`
				AvatarURL  string `json:"avatarUrl"`
				CreatedAt  string `json:"createdAt"`
				Company    string `json:"company"`
				Location   string `json:"location"`
				WebsiteURL string `json:"websiteUrl"`
			}{
				Login:      gitlabUser.Data.CurrentUser.Username,  // GitLab `username` → GitHub `login`
				Name:       gitlabUser.Data.CurrentUser.Name,      // Same field
				Email:      gitlabUser.Data.CurrentUser.Email,     // GitLab `publicEmail` → GitHub `email`
				Bio:        gitlabUser.Data.CurrentUser.Bio,       // Same field
				AvatarURL:  gitlabUser.Data.CurrentUser.AvatarURL, // Same field
				CreatedAt:  gitlabUser.Data.CurrentUser.CreatedAt, // Same field
				Company:    "",                                    // GitLab does not have `company`, therefore empty
				Location:   gitlabUser.Data.CurrentUser.Location,  // Same field
				WebsiteURL: gitlabUser.Data.CurrentUser.WebURL,    // GitLab `webUrl` → GitHub `websiteUrl`
			},
		},
	}
}

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
	// log.Printf("session=%v", session)
	for key, value := range session {
		// log.Printf("key=%v, value=%v", key, value)
		switch key {
		case api.Github, api.GHES:
			// log.Printf("github found")
			endpoint := value.URL
			token := value.Token
			// log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			githubData, err := common.SendGraphQLQuery[github.GitHubUser](graphqlgithubprefix+endpoint+graphqlgithubpath, github.GithubUserQuery, token, nil, false)
			// log.Printf("githubdata=%v, err=%v", githubData, err)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			// You're able to manipulate the data here or put it in the cache.
			userdata[string(api.Github)] = githubData
			api.SetOAuthUser(sessionID, key, githubData.Data.Viewer.Name, githubData.Data.Viewer.Email)
		case api.Gitlab:
			// log.Printf("gitlab found")
			endpoint := value.URL
			token := value.Token
			// log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			gitlabData, err := common.SendGraphQLQuery[gitlab.GitLabUser](graphqlgitlabprefix+endpoint+graphqlgitlabpath, gitlab.GitLabUserQuery, token, nil, false)
			// log.Printf("gitlabdata=%v, err=%v", gitlabData, err)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "GraphQL request failed", "details": err.Error()})
				return
			}
			githubData := convertGitLabToGitHub(*gitlabData)
			userdata[string(api.Gitlab)] = githubData
			api.SetOAuthUser(sessionID, api.Gitlab, githubData.Data.Viewer.Name, githubData.Data.Viewer.Email)
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": key})
			return
		}
	}

	// Return feedback as json
	// log.Printf("Userdata=%v", userdata)
	c.JSON(http.StatusOK, userdata)
}
