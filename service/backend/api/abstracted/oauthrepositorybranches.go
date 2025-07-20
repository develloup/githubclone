package abstracted

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/gitcache"

	"github.com/gin-gonic/gin"
)

type BranchInfo struct {
	Name       string    `json:"name"`
	CommitHash string    `json:"commit"`
	CommitDate time.Time `json:"date"`
}

func parseGitDate(dateStr string) (time.Time, error) {
	// Format 1: RFC3339 → "2022-08-01T15:54:13+00:00"
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		return t, nil
	}

	// Format 2: Git format with blanks "2022-08-01 15:54:13 +0000"
	const gitFormat = "2006-01-02 15:04:05 -0700"
	return time.Parse(gitFormat, dateStr)
}

func getSortedBranches(repoPath string, islog bool) ([]BranchInfo, error) {
	cmd := exec.Command("git", "-C", repoPath,
		"for-each-ref", "refs/remotes/origin/",
		"--sort=-committerdate",
		"--format=%(refname:short) %(objectname) %(committerdate:iso8601)")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git command failed: %w", err)
	}

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	var branches []BranchInfo

	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.SplitN(line, " ", 3)
		if len(parts) < 3 {
			continue
		}
		if islog {
			log.Printf("line: %s", line)
		}
		commitTime, err := parseGitDate(parts[2])
		if err != nil {
			if islog {
				log.Printf("error: %v", err)
			}
			continue
		}
		if islog {
			log.Printf("%s, %s, %v", parts[0], parts[1], commitTime)
		}
		branches = append(branches, BranchInfo{
			Name:       parts[0],
			CommitHash: parts[1],
			CommitDate: commitTime,
		})
	}

	return branches, nil
}

func BuildRepositoryBranchInfo(branches []BranchInfo) github.RepositoryBranchInfo {
	var result github.RepositoryBranchInfo

	// Default PageInfo (leer oder manuell setzen)
	result.Data.Repository.Refs.PageInfo = common.PageInfoNext{
		HasNextPage: false,
		EndCursor:   "",
	}

	for _, b := range branches {
		node := struct {
			Name   string `json:"name"`
			Target struct {
				CommittedDate string `json:"committedDate"`
				CheckSuites   struct {
					Nodes []struct {
						Status     string `json:"status"`
						Conclusion string `json:"conclusion"`
					} `json:"nodes"`
				} `json:"checkSuites"`
				AssociatedPullRequests struct {
					TotalCount int `json:"totalCount"`
				} `json:"associatedPullRequests"`
			} `json:"target"`
		}{}

		node.Name = b.Name
		node.Target.CommittedDate = b.CommitDate.Format(time.RFC3339)

		// Placeholder für leere/nicht abgefragte Werte
		node.Target.CheckSuites.Nodes = []struct {
			Status     string `json:"status"`
			Conclusion string `json:"conclusion"`
		}{}

		node.Target.AssociatedPullRequests.TotalCount = 0

		result.Data.Repository.Refs.Nodes = append(result.Data.Repository.Refs.Nodes, node)
	}

	// BranchProtectionRules leer lassen – wird später gefüllt
	result.Data.Repository.BranchProtectionRules.Nodes = []struct {
		Pattern                      string `json:"pattern"`
		RequiresApprovingReviews     bool   `json:"requiresApprovingReviews"`
		RequiredApprovingReviewCount int    `json:"requiredApprovingReviewCount"`
		IsAdminEnforced              bool   `json:"isAdminEnforced"`
	}{}

	return result
}

func paginateBranches(branches []BranchInfo, page int) []BranchInfo {
	const pageSize = 20
	start := (page - 1) * pageSize
	end := start + pageSize

	if start >= len(branches) {
		return []BranchInfo{}
	}
	if end > len(branches) {
		end = len(branches)
	}
	return branches[start:end]
}

func GetOAuthRepositoryBranches(c *gin.Context) {
	islog := false
	// facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	provider := c.Query("provider")
	owner := c.Query("owner")
	name := c.Query("name")
	pageStr := c.DefaultQuery("page", "1") // Fallback auf Seite 1
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page parameter"})
		return
	}
	repoURL := fmt.Sprintf("%s/%s/%s", githuburl, owner, name)

	if repoURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing URL"})
		return
	}

	// repoID := gitcache.SanitizeRepoID(repoURL)
	status := gitcache.GetStatus(repoURL)
	// log.Printf("gitcache: %v", status)

	if status == gitcache.StatusPending {
		gitcache.TriggerClone(repoURL)
		c.JSON(http.StatusAccepted, gin.H{"status": "cloning started"})
		return
	}

	if status == gitcache.StatusCloning {
		c.JSON(http.StatusAccepted, gin.H{"status": "still cloning"})
		return
	}

	if status == gitcache.StatusError {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "clone failed"})
		return
	}

	// StatusReady
	err = gitcache.AccessRepo(repoURL, func(repoPath string) error {
		branches, err := getSortedBranches(repoPath, islog)
		// if islog {
		// 	log.Printf("branches: %v", branches)
		// }
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return err
		}
		c.JSON(http.StatusOK, gin.H{provider: BuildRepositoryBranchInfo(paginateBranches(branches, page))})
		return nil
	})

	if err != nil {
		log.Printf("Access of repository failed: %v", err)
	}
}
