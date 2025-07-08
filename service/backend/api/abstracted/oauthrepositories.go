package abstracted

import (
	"encoding/base64"
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/cachable"
	"githubclone-backend/utils"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

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

	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)

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
			// log.Printf("endpoint=%s, token=%s", value.URL, value.Token)
			cacheKey := fmt.Sprintf("repos:%s:%s:%s:%s", sessionID, validParams["field"], validParams["direction"], validParams["after"])
			githubData, found, err := facade.GitHubRepositoriesOfViewerCache.Get(cacheKey)
			if err != nil {
				log.Printf("cache read error: %v", err)
			}

			if !found || githubData == nil {
				log.Printf("Make graphql request for GetOAuthRepositories")
				githubData, err = common.SendGraphQLQuery[github.GitHubRepositoriesOfViewer](
					graphqlgithubprefix+endpoint+graphqlgithubpath,
					github.GithubRepositoriesOfViewerQuery,
					token,
					validParams,
					false,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error":   "GraphQL request failed",
						"details": err.Error(),
					})
					return
				}

				if err := facade.GitHubRepositoriesOfViewerCache.Set(cacheKey, *githubData); err != nil {
					log.Printf("cache write error: %v", err)
				}
			}
			// You're able to manipulate the data here or put it in the cache.
			userdata[string(key)] = githubData
		case api.Gitlab:
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unsupported provider", "details": key})
			return
		}
	}
	c.JSON(http.StatusOK, userdata)
}

func GetOAuthRepository(c *gin.Context) {
	islog := false
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	owner := c.Query("owner")
	repo := c.Query("name")

	validParams := map[string]interface{}{
		"owner": owner,
		"name":  repo,
	}
	cacheKey := fmt.Sprintf("repository:%s:%s:%s", provider, owner, repo)

	GetOAuthCommonProvider(
		c,
		provider,
		github.GithubRepositoryQuery,
		validParams,
		facade.GitHubRepositoryNodeWithAttributesCache,
		cacheKey,
		islog,
	)
}

func GetOAuthRepositoryBranchCommit(c *gin.Context) {
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	owner := c.Query("owner")
	repo := c.Query("name")
	expression := c.Query("expression")
	validParams := map[string]interface{}{
		"owner":      owner,
		"name":       repo,
		"expression": expression,
	}

	cacheKey := fmt.Sprintf("branchcommit:%s:%s:%s:%s", provider, owner, repo, expression)
	GetOAuthCommonProvider(
		c,
		provider,
		github.GithubRepositoryBranchCommitQuery,
		validParams,
		facade.GitHubRepositoryBranchCommitCache,
		cacheKey,
		false,
	)
}

func fetchContributorsWithCount(
	endpoint string,
	token string,
	params map[string]interface{},
	islog bool,
) (*github.RepositoryContributor, error) {

	owner, _ := params["owner"].(string)
	repo, _ := params["name"].(string)
	limit := 14

	// Determine the total count via per_page=1
	countPath := fmt.Sprintf("/repos/%s/%s/contributors?per_page=1", owner, repo)
	countResp, err := common.SendRestAPIQuery[[]github.RepositoryContributorNode](endpoint, countPath, token, islog)
	if err != nil {
		// Optional: special handling for 204 (empty data)
		if strings.Contains(err.Error(), "204") {
			return &github.RepositoryContributor{
				TotalCount: 0,
				Nodes:      []github.RepositoryContributorNode{},
			}, nil
		}
		return nil, err
	}
	total := 1 // Fallback
	if link := countResp.Resp.Header.Get("Link"); link != "" {
		re := regexp.MustCompile(`&page=(\d+)>; rel="last"`)
		if m := re.FindStringSubmatch(link); len(m) == 2 {
			if parsed, err := strconv.Atoi(m[1]); err == nil {
				total = parsed
			}
		}
	}

	// Load first 14 contributors
	dataPath := fmt.Sprintf("/repos/%s/%s/contributors?per_page=%d&page=1", owner, repo, limit)
	dataResp, err := common.SendRestAPIQuery[[]github.RepositoryContributorNodeFromAPI](endpoint, dataPath, token, islog)
	if err != nil {
		return nil, err
	}

	mapped := make([]github.RepositoryContributorNode, 0, len(*dataResp.Result))
	for _, c := range *dataResp.Result {
		mapped = append(mapped, github.RepositoryContributorNode{
			Login:         c.Login,
			Contributions: c.Contributions,
			AvatarUrl:     c.AvatarURL,
			HtmlUrl:       c.HTMLURL,
		})
	}

	return &github.RepositoryContributor{
		TotalCount: total,
		Nodes:      mapped,
	}, nil
}

func GetOAuthRepositoryContributors(c *gin.Context) {
	provider := c.Query("provider")
	owner := c.Query("owner")
	name := c.Query("name")

	cacheKey := fmt.Sprintf("contributors:%s:%s:%s", provider, owner, name)
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)

	validParams := map[string]interface{}{
		"owner": owner,
		"name":  name,
	}

	GetOAuthCommonProviderREST(
		c,
		provider,
		validParams,
		fetchContributorsWithCount,
		facade.GitHubRepositoryContributorCache,
		cacheKey,
		false,
	)
}

func fetchFileViaHelper(endpoint string, token string, params map[string]interface{}, islog bool) (*github.GitHubFile, error) {
	owner, _ := params["owner"].(string)
	name, _ := params["name"].(string)
	path, _ := params["path"].(string)
	ref, _ := params["ref"].(string)

	contentPath := fmt.Sprintf("repos/%s/%s/contents/%s", owner, name, path)
	if ref != "" {
		contentPath += "?ref=" + url.QueryEscape(ref)
	}

	if islog {
		log.Printf("contentPath=%s", contentPath)
	}

	result, err := common.SendRestAPIQuery[github.GitHubFile](endpoint, contentPath, token, islog)
	if err != nil {
		return nil, err
	}

	decoded, err := base64.StdEncoding.DecodeString(result.Result.Content)
	if err != nil {
		return nil, fmt.Errorf("Base64 decoding failed: %w", err)
	}
	result.Result.MIME = utils.DetectMIME(path, decoded)
	return result.Result, nil
}

func GetOAuthRepositoryContent(c *gin.Context) {
	provider := c.Query("provider")
	owner := c.Query("owner")
	name := c.Query("name")
	path := c.Query("content")
	ref := c.Query("expression")

	cacheKey := fmt.Sprintf("content:%s:%s:%s:%s:%s", provider, owner, name, path, ref)
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)

	// Sonst → hol Daten und speichere
	validParams := map[string]interface{}{
		"owner": owner,
		"name":  name,
		"path":  path,
		"ref":   ref,
	}
	GetOAuthCommonProviderREST(c, provider, validParams, fetchFileViaHelper, facade.GitHubFileCache, cacheKey, false)

}
