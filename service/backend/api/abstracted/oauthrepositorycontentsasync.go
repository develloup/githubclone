package abstracted

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/cachable"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const MAX_LIMIT = 40

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

func sortContents(contents []GithubContent) {
	sort.Slice(contents, func(i, j int) bool {
		// "dir" und "submodule" should be handles the same way and are sorted in front of other types
		isPreferred := func(t string) bool {
			return t == "dir" || t == "submodule"
		}

		inGroupI := isPreferred(contents[i].Type)
		inGroupJ := isPreferred(contents[j].Type)

		if inGroupI != inGroupJ {
			return inGroupI // true kommt vor false
		}

		// innerhalb der Gruppe: nach Name sortieren
		return contents[i].Name < contents[j].Name
	})
}

func convertToRepositoryTree(owner, name string, contents []GithubContent) github.RepositoryTreeCommit {
	var tree github.RepositoryTreeCommit

	for i := range contents {
		if contents[i].Size == 0 && contents[i].Type == "file" {
			u, _ := url.Parse(contents[i].HTMLURL)
			segments := strings.Split(strings.Trim(u.Path, "/"), "/")
			if len(segments) >= 2 {
				if owner != segments[0] || name != segments[1] {
					contents[i].Type = "submodule"
					// log.Printf("commit found: %s @ %s", contents[i].Name, contents[i].SHA)
				}
			}
		}
	}
	sortContents(contents)
	for _, item := range contents {
		// log.Printf("item: %s, %s, %s, %d, %s, %s", item.Name, item.Path, item.SHA, item.Size, item.Type, item.HTMLURL)
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
			Oid:           item.SHA,
			Message:       "", // Placeholders
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
		log.Printf("The raw data: %v", *result.Result)
	}
	tree := convertToRepositoryTree(owner, name, *result.Result)
	return &tree, nil
}

func buildCommitQueryFromEntriesAsync(entries []github.RepositoryEntryTreeCommit, owner, repo string, validParams map[string]interface{}, islog bool) string {
	var fields []string
	for i := 0; i < len(entries); i++ {
		alias := fmt.Sprintf("f%d", i)
		fields = append(fields, fmt.Sprintf(`%s: history(first: 1, path: %q) {
    nodes {
        oid
        message
        committedDate
    }
}`, alias, entries[i].Name))
	}

	query := fmt.Sprintf(`
query {
  repository(owner: %q, name: %q) {
    ref(qualifiedName: %q) {
      target {
        ... on Commit {
%s
        }
      }
    }
  }
}`, owner, repo, validParams["expressioncontent"], indentLines(fields, 10))

	if islog {
		log.Printf("query=%v,", query)
	}
	return query
}

func indexOfEntry(slice []github.RepositoryEntryTreeCommit, name string) int {
	for i, v := range slice {
		if v.Name == name {
			return i
		}
	}
	return -1
}

func findCommitInformation(raw map[string]interface{}) map[string]interface{} {
	data, ok := raw["data"].(map[string]interface{})
	if !ok {
		return nil
	}
	repo, ok := data["repository"].(map[string]interface{})
	if !ok {
		return nil
	}
	ref, ok := repo["ref"].(map[string]interface{})
	if !ok {
		return nil
	}
	target, ok := ref["target"].(map[string]interface{})
	if !ok {
		return nil
	}
	return target
}

func mergeCommitInfoIntoEntries(entries []github.RepositoryEntryTreeCommit, target map[string]interface{}) {
	for i := range entries {
		alias := fmt.Sprintf("f%d", i)
		entry, _ := target[alias].(map[string]interface{})
		nodes, _ := entry["nodes"].([]interface{})
		node, _ := nodes[0].(map[string]interface{})
		entries[i].Oid = node["oid"].(string)
		entries[i].Message = node["message"].(string)
		entries[i].CommittedDate = node["committedDate"].(string)
	}
}

func GetOauthRepositoryContentsAsync(c *gin.Context) {
	facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	owner := c.Query("owner")
	repo := c.Query("name")
	expression := c.Query("expression")

	start := c.Query("start")
	limit, err := strconv.Atoi(c.Query("limit"))
	if err != nil || limit <= 0 {
		limit = -1
	}

	partialRequest := start != "" && limit >= 0

	validParams := map[string]interface{}{
		"owner":             owner,
		"name":              repo,
		"expression":        expression + ":",
		"expressioncontent": expression,
	}

	islog := false
	cacheKey := fmt.Sprintf("branchcommit:%s:%s:%s:%s", provider, owner, repo, expression)

	data, err, cached := GetOAuthCommonProviderRESTIntern(c, provider, validParams, fetchRepositoryDirectory, facade.GitHubRepositoryTreeCommit, cacheKey, islog)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if islog {
		log.Printf("err=%v, cached=%v", err, cached)
	}
	var userdata = make(map[string]interface{})
	// If data was missing then just return the full entries without commit-information
	nameindex := -1
	if partialRequest {
		nameindex = indexOfEntry(data.Data.Repository.Object.Entries, start)
	}
	if !cached || nameindex < 0 {
		data.Partial = false
		userdata[string(api.Github)] = data
		c.JSON(http.StatusOK, userdata)
	} else {
		distance := len(data.Data.Repository.Object.Entries) - nameindex
		if distance > limit {
			distance = limit
		}
		if distance > MAX_LIMIT {
			distance = MAX_LIMIT
		}
		query := buildCommitQueryFromEntriesAsync(data.Data.Repository.Object.Entries[nameindex:nameindex+distance], owner, repo, validParams, islog)
		data1, err1 := GetOAuthCommonProviderIntern[map[string]interface{}](c, provider, query, validParams, islog)
		if err1 != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err1.Error()})
			return
		}
		target := findCommitInformation(*data1)
		mergeCommitInfoIntoEntries(data.Data.Repository.Object.Entries[nameindex:nameindex+distance], target)
		var partial github.RepositoryTreeCommit
		partial.Partial = true
		partial.Data.Repository.Object.Entries = data.Data.Repository.Object.Entries[nameindex : nameindex+distance]
		userdata[string(api.Github)] = partial
		facade.GitHubRepositoryTreeCommit.Set(cacheKey, *data)
		c.JSON(http.StatusOK, userdata)
	}
}
