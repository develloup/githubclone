package abstracted

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/github"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// TODO: integrate the facade to support a cache for graphql data from github
// facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
// log.Printf("Facade: %v", facade)

type commitInfo struct {
	Oid           string
	Message       string
	CommittedDate string
}

func indentLines(lines []string, spaces int) string {
	pad := strings.Repeat(" ", spaces)
	return pad + strings.Join(lines, "\n"+pad)
}

func parseCommitHistoryResult(raw map[string]interface{}, aliasToPath map[string]string) map[string]commitInfo {
	results := make(map[string]commitInfo)

	// Deep access to JSON result
	data, ok := raw["data"].(map[string]interface{})
	if !ok {
		return results
	}
	repo, ok := data["repository"].(map[string]interface{})
	if !ok {
		return results
	}
	ref, ok := repo["ref"].(map[string]interface{})
	if !ok {
		return results
	}
	target, ok := ref["target"].(map[string]interface{})
	if !ok {
		return results
	}

	// Iterate over all aliases
	for alias, path := range aliasToPath {
		if entry, ok := target[alias].(map[string]interface{}); ok {
			if nodes, ok := entry["nodes"].([]interface{}); ok && len(nodes) > 0 {
				if node, ok := nodes[0].(map[string]interface{}); ok {
					oid, _ := node["oid"].(string)
					msg, _ := node["message"].(string)
					date, _ := node["committedDate"].(string)
					results[path] = commitInfo{
						Oid:           oid,
						Message:       msg,
						CommittedDate: date,
					}
				}
			}
		}
	}

	return results
}

func buildCommitQueriesFromEntries(entries []string, owner, repo string, validParams map[string]interface{}, islog bool) ([]string, map[string]string) {
	const maxPerQuery = 40
	var queries []string
	aliasToPath := make(map[string]string)

	for i := 0; i < len(entries); i += maxPerQuery {
		end := i + maxPerQuery
		if end > len(entries) {
			end = len(entries)
		}
		chunk := entries[i:end]

		var fields []string
		for j, name := range chunk {
			alias := fmt.Sprintf("f%d", i+j)
			aliasToPath[alias] = name
			fields = append(fields, fmt.Sprintf(`%s: history(first: 1, path: %q) {
  nodes {
    oid
    message
    committedDate
  }
}`, alias, name))
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
		queries = append(queries, query)
	}
	if islog {
		log.Printf("queries=%v,", queries)
		log.Printf("aliasToPath=%v", aliasToPath)
	}
	return queries, aliasToPath
}

func mergeCommitsIntoTree(tree *github.RepositoryTreeCommit, commits map[string]commitInfo) {
	entries := tree.Data.Repository.Object.Entries
	for i, entry := range entries {
		if commit, ok := commits[entry.Name]; ok {
			tree.Data.Repository.Object.Entries[i].Oid = commit.Oid
			tree.Data.Repository.Object.Entries[i].Message = commit.Message
			tree.Data.Repository.Object.Entries[i].CommittedDate = commit.CommittedDate
		}
	}
}

func GetOauthRepositoryContents(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner":             c.Query("owner"),
		"name":              c.Query("name"),
		"expression":        c.Query("expression") + ":",
		"expressioncontent": c.Query("expression"),
	}

	islog := false

	data, err := GetOAuthCommonProviderIntern[github.RepositoryTreeCommit](c, provider, github.GithubRepositoryContentsQuery, validParams, islog)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	entries := data.Data.Repository.Object.Entries
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		names = append(names, entry.Name)
	}

	owner, _ := validParams["owner"].(string)
	repo, _ := validParams["name"].(string)

	queries, aliasToPath := buildCommitQueriesFromEntries(names, owner, repo, validParams, islog)
	commitMap := make(map[string]commitInfo)

	for _, query := range queries {
		data1, err1 := GetOAuthCommonProviderIntern[map[string]interface{}](c, provider, query, validParams, islog)
		if err1 != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err1.Error()})
			return
		}
		chunk := parseCommitHistoryResult(*data1, aliasToPath)
		if islog {
			log.Printf("chunk=%v", chunk)
		}
		for k, v := range chunk {
			commitMap[k] = v
		}
	}
	if islog {
		log.Printf("data=%v", data)
		log.Printf("commitMap=%v", commitMap)
	}
	mergeCommitsIntoTree(data, commitMap)
	if islog {
		log.Printf("mergeddata=%v", data)
	}
	var userdata = make(map[string]interface{})
	userdata[string(api.Github)] = data
	c.JSON(http.StatusOK, userdata)
}
