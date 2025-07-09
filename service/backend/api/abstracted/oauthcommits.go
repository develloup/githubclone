package abstracted

import (
	"fmt"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func fetchCommitsCompareHelper(endpoint string, token string, params map[string]interface{}, islog bool) (*github.ResponseCommitsCompare, error) {
	sourceOwner, _ := params["sourceowner"].(string)
	sourceBranch, _ := params["sourcebranch"].(string)
	targetOwner, _ := params["targetowner"].(string)
	targetName, _ := params["targetname"].(string)
	targetBranch, _ := params["targetbranch"].(string)

	comparePath := fmt.Sprintf("repos/%s/%s/compare/%s:%s...%s:%s", targetOwner, targetName, sourceOwner, sourceBranch, targetOwner, targetBranch)

	if islog {
		log.Printf("comparePath=%s", comparePath)
	}
	result, err := common.SendRestAPIQuery[github.ResponseCommitsCompare](endpoint, comparePath, token, islog)
	if err != nil {
		return nil, err
	}
	return result.Result, nil
}

func GetOAuthCommitsCompare(c *gin.Context) {
	// // facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	sourceOwner := c.Query("sourceowner")
	sourceName := c.Query("sourcename")
	sourceBranch := c.Query("sourcebranch")
	targetOwner := c.Query("targetowner")
	targetName := c.Query("targetname")
	targetBranch := c.Query("targetbranch")

	islog := true
	if sourceOwner == "" || sourceName == "" || sourceBranch == "" ||
		targetOwner == "" || targetName == "" || targetBranch == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	validParams := map[string]interface{}{
		"sourceowner":  sourceOwner,
		"sourcename":   sourceName,
		"sourcebranch": sourceBranch,
		"targetowner":  targetOwner,
		"targetname":   targetName,
		"targetbranch": targetBranch,
	}

	githubdata, err, _ := GetOAuthCommonProviderRESTIntern(c, provider, validParams, fetchCommitsCompareHelper, nil, "", islog)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode GitHub response: {err}"})
		return
	}

	result := github.CommitsCompareResult{
		Source:       fmt.Sprintf("%s/%s:%s", sourceOwner, sourceName, sourceBranch),
		Target:       fmt.Sprintf("%s/%s:%s", targetOwner, targetName, targetBranch),
		AheadBy:      githubdata.AheadBy,
		BehindBy:     githubdata.BehindBy,
		Status:       githubdata.Status,
		MergeBaseSHA: githubdata.MergeBaseCommit.SHA,
	}

	c.JSON(http.StatusOK, gin.H{provider: result})
}
