package abstracted

import (
	"fmt"
	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"log"
	"net/http"
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

func GetOAuthRepositoryBranchCommit(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner":      c.Query("owner"),
		"name":       c.Query("name"),
		"expression": c.Query("expression"),
	}

	GetOAuthCommonProvider[github.RepositoryBranchCommit](c, provider, github.GithubRepositoryBranchCommitQuery, validParams, true)
}

func GetOauthRepositoryContents(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner":      c.Query("owner"),
		"name":       c.Query("name"),
		"expression": c.DefaultQuery("expression", "HEAD:"),
	}

	data, err := GetOAuthCommonProviderIntern[github.RepositoryTreeCommit](c, provider, github.GithubRepositoryContentsQuery, validParams, false)
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

	queries, aliasToPath := BuildCommitQueriesFromEntries(names, owner, repo)
	commitMap := make(map[string]CommitInfo)

	for _, query := range queries {
		data1, err1 := GetOAuthCommonProviderIntern[map[string]interface{}](c, provider, query, validParams, false)
		if err1 != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err1.Error()})
			return
		}
		chunk := ParseCommitHistoryResult(*data1, aliasToPath)
		for k, v := range chunk {
			commitMap[k] = v
		}
	}
	MergeCommitsIntoTree(data, commitMap)
	var userdata = make(map[string]interface{})
	userdata[string(api.Github)] = data
	c.JSON(http.StatusOK, userdata)
}

func MergeCommitsIntoTree(tree *github.RepositoryTreeCommit, commits map[string]CommitInfo) {
	entries := tree.Data.Repository.Object.Entries
	for i, entry := range entries {
		if commit, ok := commits[entry.Name]; ok {
			tree.Data.Repository.Object.Entries[i].Message = commit.Message
			tree.Data.Repository.Object.Entries[i].CommittedDate = commit.CommittedDate
		}
	}
}

type CommitInfo struct {
	Message       string
	CommittedDate string
}

func ParseCommitHistoryResult(raw map[string]interface{}, aliasToPath map[string]string) map[string]CommitInfo {
	results := make(map[string]CommitInfo)

	// Tiefer Zugriff ins JSON-Ergebnis
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

	// Jetzt über alle Aliases iterieren
	for alias, path := range aliasToPath {
		if entry, ok := target[alias].(map[string]interface{}); ok {
			if nodes, ok := entry["nodes"].([]interface{}); ok && len(nodes) > 0 {
				if node, ok := nodes[0].(map[string]interface{}); ok {
					msg, _ := node["message"].(string)
					date, _ := node["committedDate"].(string)
					results[path] = CommitInfo{
						Message:       msg,
						CommittedDate: date,
					}
				}
			}
		}
	}

	return results
}

func BuildCommitQueriesFromEntries(entries []string, owner, repo string) ([]string, map[string]string) {
	const maxPerQuery = 20
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
    message
    committedDate
  }
}`, alias, name))
		}

		query := fmt.Sprintf(`
query {
  repository(owner: %q, name: %q) {
    ref(qualifiedName: "refs/heads/main") {
      target {
        ... on Commit {
%s
        }
      }
    }
  }
}`, owner, repo, indentLines(fields, 10))
		queries = append(queries, query)
	}

	return queries, aliasToPath
}

func indentLines(lines []string, spaces int) string {
	pad := strings.Repeat(" ", spaces)
	return pad + strings.Join(lines, "\n"+pad)
}

func GetOAuthRepositoryContributors(c *gin.Context) {
	provider := c.Query("provider")
	validParams := map[string]interface{}{
		"owner": c.Query("owner"),
		"name":  c.Query("name"),
	}

	GetOAuthCommonProviderREST(c, provider, validParams, fetchContributorsWithCount, true)
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
