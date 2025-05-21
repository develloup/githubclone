package abstracted

import (
	"githubclone-backend/api/common"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetRepositoryIssues(c *gin.Context) {
	token := c.Request.Header.Get("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing OAuth token"})
		return
	}

	// Parameter aus dem Request auslesen
	rawParams := map[string]string{
		"owner":     c.Query("owner"), // Name des Repository-Besitzers
		"name":      c.Query("name"),  // Name des Repositorys
		"first":     c.DefaultQuery("first", strconv.Itoa(common.DefaultFirst)),
		"after":     c.Query("after"),
		"last":      c.Query("last"),
		"before":    c.Query("before"),
		"field":     c.DefaultQuery("field", "UPDATED_AT"),
		"direction": c.DefaultQuery("direction", "DESC"),
	}

	// Überprüfen, ob `owner` und `name` gesetzt wurden
	if rawParams["owner"] == "" || rawParams["name"] == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters: owner and name"})
		return
	}

	// // Parameter validieren
	// validParams := common.ValidateGraphQLParams(true, rawParams, map[string]map[string]bool{
	// 	"field":     {"CREATED_AT": true, "UPDATED_AT": true, "COMMENTS": true},
	// 	"direction": {"ASC": true, "DESC": true},
	// })

	// // API-Request ausführen
	// var issuesData GitHubRepositoryIssuesResponse
	// err = common.SendGraphQLQuery("https://api.github.com/graphql", github.GithubRepoIssuesQuery, token, validParams, &issuesData)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	// 	return
	// }

	// c.JSON(http.StatusOK, issuesData)
}
