package abstracted

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/cachable"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GithubContent struct {
	Name            string            `json:"name"`
	Path            string            `json:"path"`
	SHA             string            `json:"sha"`
	Size            int               `json:"size"`
	Type            string            `json:"type"` // "file", "dir", "symlink", "submodule"
	URL             string            `json:"url"`
	HTMLURL         string            `json:"html_url"`
	GitURL          string            `json:"git_url"`
	DownloadURL     string            `json:"download_url"`
	SubmoduleGitURL string            `json:"submodule_git_url,omitempty"` // nur bei Submodules
	Links           map[string]string `json:"_links"`
}

func ConvertToRepositoryTree(contents []GithubContent) github.RepositoryTreeCommit {
	var tree github.RepositoryTreeCommit

	for _, item := range contents {
		var gqlType string
		switch item.Type {
		case "file":
			gqlType = "blob"
		case "dir":
			gqlType = "tree"
		case "symlink":
			gqlType = "symlink"
		case "submodule":
			gqlType = "commit"
		default:
			gqlType = "blob"
		}

		var mode string
		switch item.Type {
		case "file":
			mode = "100644"
		case "dir":
			mode = "040000"
		case "symlink":
			mode = "120000"
		case "commit":
			mode = "160000"
		default:
			mode = "100644"
		}

		entry := struct {
			Name          string `json:"name"`
			Type          string `json:"type"`
			Mode          string `json:"mode"`
			Oid           string `json:"oid"`
			Message       string `json:"message"`
			CommittedDate string `json:"committedDate"`
		}{
			Name:          item.Name,
			Type:          gqlType,
			Mode:          mode,
			Oid:           "", // Placeholders
			Message:       "",
			CommittedDate: "",
		}

		tree.Data.Repository.Object.Entries = append(tree.Data.Repository.Object.Entries, entry)
	}

	return tree
}

func fetchRepositoryDirectory(endpoint string, token string, params map[string]interface{}, islog bool) (*github.RepositoryTreeCommit, error) {
	owner, _ := params["owner"].(string)
	name, _ := params["name"].(string)
	path, _ := params["path"].(string)
	ref, exists := params["ref"].(string)

	repoDirPath := fmt.Sprintf("repos/%s/%s/contents/%s", owner, name, path)
	if exists && ref != "" {
		repoDirPath += fmt.Sprintf("?ref=%s", ref)
	}
	if islog {
		log.Printf("repoDirPath=%s", repoDirPath)
	}

	result, err := common.SendRestAPIQuery[[]GithubContent](endpoint, repoDirPath, token, islog)
	if err != nil {
		return nil, err
	}
	if islog {
		log.Printf("#Entries: %d", (len(*result.Result)))
	}
	tree := ConvertToRepositoryTree(*result.Result)
	return &tree, nil
}

func GetOauthRepositoryContentsAsync(c *gin.Context) {
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	owner := c.Query("owner")
	repo := c.Query("name")
	expression := c.Query("expression")

	validParams := map[string]interface{}{
		"owner":             owner,
		"name":              repo,
		"expression":        expression + ":",
		"expressioncontent": expression,
	}

	islog := false
	cacheKey := fmt.Sprintf("branchcommit:%s:%s:%s:%s", provider, owner, repo, expression)

	data, err := GetOAuthCommonProviderRESTIntern(c, provider, validParams, fetchRepositoryDirectory, facade.GitHubRepositoryTreeCommit, cacheKey, islog)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// log.Printf("data=%v, err=%v", data, err)
	var userdata = make(map[string]interface{})
	userdata[string(api.Github)] = data
	c.JSON(http.StatusOK, userdata)
}
