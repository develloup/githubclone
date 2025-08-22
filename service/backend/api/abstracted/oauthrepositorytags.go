package abstracted

import (
	"bufio"
	"fmt"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/api/pageinfo"
	"githubclone-backend/gitcache"
	"log"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type TagInfo struct {
	Name       string    `json:"name"`
	CommitHash string    `json:"commit"`
	CommitDate time.Time `json:"date"`
}

func getSortedTags(repoPath string, islog bool) ([]TagInfo, error) {
	cmd := exec.Command("git", "-C", repoPath,
		"for-each-ref", "refs/tags",
		"--sort=-creatordate",
		"--format=%(refname:short) %(objectname) %(creatordate:format:%Y-%m-%dT%H:%M:%S%z)")

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("git command failed: %w", err)
	}

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	var tags []TagInfo

	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) < 3 {
			continue
		}

		tagName := parts[0]
		commitHash := parts[1]
		commitTime, err := parseGitDate(parts[2])
		if err != nil {
			if islog {
				log.Printf("error parsing date: %v", err)
			}
			continue
		}

		tagInfo := TagInfo{
			Name:       tagName,
			CommitHash: commitHash,
			CommitDate: commitTime,
		}

		tags = append(tags, tagInfo)
	}

	return tags, nil
}

func BuildRepositoryTagInfo(tags []TagInfo, pageinfo common.PageInfoNext) github.RepositoryTagInfo {
	var result github.RepositoryTagInfo

	result.Data.Repository.Refs.PageInfo = pageinfo
	for _, t := range tags {
		node := github.RepositoryTagInfoNode{}
		node.Name = t.Name
		node.Target.CommittedDate = t.CommitDate.Format(time.RFC3339)
		result.Data.Repository.Refs.Nodes = append(result.Data.Repository.Refs.Nodes, node)
	}
	return result
}

func GetOAuthRepositoryTags(c *gin.Context) {
	islog := false
	// facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	_ /*sessionID*/, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID found in cookie"})
		return
	}

	provider := c.Query("provider")
	owner := c.Query("owner")
	name := c.Query("name")
	pageStr := c.DefaultQuery("page", "1") // Fallback to page 1
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
		tags, err := getSortedTags(repoPath, islog)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return err
		}

		c.JSON(http.StatusOK, gin.H{
			provider: gin.H{
				"yours": BuildRepositoryTagInfo(pageinfo.PaginateSlice(tags, page, 10)),
			},
		})

		return nil
	})
	if err != nil {
		log.Printf("Access of repository failed: %v", err)
	}

}
