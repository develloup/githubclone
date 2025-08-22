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

	"githubclone-backend/api"
	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/api/pageinfo"
	"githubclone-backend/gitcache"

	"github.com/gin-gonic/gin"
)

type BranchInfo struct {
	Name           string    `json:"name"`
	CommitHash     string    `json:"commit"`
	CommitDate     time.Time `json:"date"`
	CommitterName  string    `json:"committername"`
	CommitterEmail string    `json:"committeremail"`
}

func parseGitDate(dateStr string) (time.Time, error) {
	// Format 1: RFC3339 → "2022-08-01T15:54:13+00:00"
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		return t, nil
	}
	// Format 2: Git ISO8601 without blanks "2025-07-08T15:25:52+0200"
	const gitIsoFormat = "2006-01-02T15:04:05-0700"
	if t, err := time.Parse(gitIsoFormat, dateStr); err == nil {
		return t, nil
	}
	// Format 3: Git format with blanks "2022-08-01 15:54:13 +0000"
	const gitFormat = "2006-01-02 15:04:05 -0700"
	return time.Parse(gitFormat, dateStr)
}

func getDefaultBranch(repoURL string) (string, string, error) {
	cmd := exec.Command("git", "ls-remote", "--symref", repoURL, "HEAD")
	output, err := cmd.Output()
	if err != nil {
		return "", "", fmt.Errorf("git ls-remote failed: %w", err)
	}

	var branchName string
	var commitHash string

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()

		// Line with branch name
		if strings.HasPrefix(line, "ref: refs/heads/") && strings.HasSuffix(line, "\tHEAD") {
			parts := strings.Split(line, "\t")
			branchName = strings.TrimPrefix(parts[0], "ref: refs/heads/")
		}

		// Line with commit hash
		if strings.HasSuffix(line, "\tHEAD") && !strings.HasPrefix(line, "ref:") {
			parts := strings.Split(line, "\t")
			commitHash = parts[0]
		}
	}

	if branchName == "" || commitHash == "" {
		return "", "", fmt.Errorf("could not parse branch or commit hash")
	}

	return branchName, commitHash, nil
}

func getSortedBranches(defaultBranch *BranchInfo, repoPath string, oauthuser string, oauthemail string, islog bool) ([]BranchInfo, []BranchInfo, error) {
	cmd := exec.Command("git", "-C", repoPath,
		"for-each-ref", "refs/remotes/origin/",
		"--sort=-committerdate",
		"--format=%(refname:short) %(objectname) %(committerdate:format:%Y-%m-%dT%H:%M:%S%z) %(committername) %(committeremail)")

	output, err := cmd.Output()
	if err != nil {
		return nil, nil, fmt.Errorf("git command failed: %w", err)
	}

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	var branches []BranchInfo
	var yourbranches []BranchInfo
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Fields(line)
		if len(parts) < 5 {
			continue
		}
		// if islog {
		// 	log.Printf("line: %s", line)
		// }
		branchName := parts[0]
		if branchName == "origin" {
			continue
		}
		branchName = strings.TrimPrefix(branchName, "origin/")
		commitTime, err := parseGitDate(parts[2])
		if err != nil {
			if islog {
				log.Printf("error: %v", err)
			}
			continue
		}
		committerName := parts[3]
		committerEmail := parts[4]

		// if islog {
		// 	log.Printf("%s, %s, %v, %s <%s>", branchName, parts[1], commitTime, committerName, committerEmail)
		// }
		if branchName != defaultBranch.Name {
			branches = append(branches, BranchInfo{
				Name:           branchName,
				CommitHash:     parts[1],
				CommitDate:     commitTime,
				CommitterName:  committerName,
				CommitterEmail: committerEmail,
			})
			if strings.Contains(committerName, oauthuser) && strings.Contains(committerEmail, oauthemail) {
				yourbranches = append(yourbranches, BranchInfo{
					Name:           branchName,
					CommitHash:     parts[1],
					CommitDate:     commitTime,
					CommitterName:  committerName,
					CommitterEmail: committerEmail,
				})
			}
		} else {
			defaultBranch.CommitHash = parts[1]
			defaultBranch.CommitDate = commitTime
			defaultBranch.CommitterName = committerName
			defaultBranch.CommitterEmail = committerEmail
			if islog {
				log.Printf("DefaultBranch: %v", defaultBranch)
			}
		}
	}
	return branches, yourbranches, nil
}

func BuildRepositoryBranchInfo(branches []BranchInfo, pageinfo common.PageInfoNext) github.RepositoryBranchInfo {
	var result github.RepositoryBranchInfo

	result.Data.Repository.Refs.PageInfo = pageinfo

	for _, b := range branches {
		node := github.RepositoryBranchInfoNode{}
		node.Name = b.Name
		node.Target.CommittedDate = b.CommitDate.Format(time.RFC3339)

		// Placeholder for empty or not requested values
		node.Target.CheckSuites.Nodes = []github.RepositoryBranchCheckSuitesInfoNode{}

		node.Target.AssociatedPullRequests.TotalCount = 0

		result.Data.Repository.Refs.Nodes = append(result.Data.Repository.Refs.Nodes, node)
	}

	// BranchProtectionRules left empty, will be filled later
	result.Data.Repository.BranchProtectionRules.Nodes = []github.RepositoryBranchProtectionRule{}
	return result
}

func filterActive(branches []BranchInfo) []BranchInfo {
	var active []BranchInfo
	threeMonth := time.Now().AddDate(0, -3, 0)

	for _, b := range branches {
		if b.CommitDate.After(threeMonth) {
			active = append(active, b)
		}
	}
	return active
}

func filterStale(branches []BranchInfo) []BranchInfo {
	var stale []BranchInfo
	threeMonth := time.Now().AddDate(0, -3, 0)

	for _, b := range branches {
		if !b.CommitDate.After(threeMonth) {
			stale = append(stale, b)
		}
	}
	return stale
}

func GetOAuthRepositoryBranches(c *gin.Context) {
	islog := false
	// facade := c.MustGet("cacheFacade").(*cachable.CacheFacade)
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No session ID found in cookie"})
		return
	}

	provider := c.Query("provider")
	owner := c.Query("owner")
	name := c.Query("name")
	filterStr := c.DefaultQuery("tab", "0")
	pageStr := c.DefaultQuery("page", "1") // Fallback to page 1
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid page parameter"})
		return
	}
	filter, err := strconv.Atoi(filterStr)
	if err != nil || filter < 0 || filter > 4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid filter parameter"})
		return
	}

	oauthuser, oauthemail, _ := api.GetOAuthUser(sessionID, api.OAuthProvider(provider))
	repoURL := fmt.Sprintf("%s/%s/%s", githuburl, owner, name)

	if repoURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing URL"})
		return
	}

	// repoID := gitcache.SanitizeRepoID(repoURL)
	status := gitcache.GetStatus(repoURL)
	// log.Printf("gitcache: %v", status)
	if islog {
		log.Printf("Username=%s, E-Mail=%s", oauthuser, oauthemail)
	}

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
		defaultBranch, _, err := getDefaultBranch(repoURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return err
		}
		defBranchInfo := BranchInfo{
			Name: defaultBranch,
		}
		branches, yourbranches, err := getSortedBranches(&defBranchInfo, repoPath, oauthuser, oauthemail, islog)
		// if islog {
		// 	log.Printf("branches: %v", branches)
		// }
		if islog {
			log.Printf("DefBranchInfo: %v", defBranchInfo)
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return err
		}

		pageinfodef := common.PageInfoNext{HasPreviousPage: false, HasNextPage: false}
		switch filter {
		case 0:
			// Overview
			c.JSON(http.StatusOK, gin.H{
				provider: gin.H{
					"active":  BuildRepositoryBranchInfo(pageinfo.PaginateSlice(filterActive(branches), page, 5)),
					"yours":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(yourbranches, page, 5)),
					"default": BuildRepositoryBranchInfo([]BranchInfo{defBranchInfo}, pageinfodef),
				},
			})
		case 1:
			// Active
			c.JSON(http.StatusOK, gin.H{
				provider: gin.H{
					"active":  BuildRepositoryBranchInfo(pageinfo.PaginateSlice(filterActive(branches), page, 20)),
					"yours":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(yourbranches, page, 1)),
					"default": BuildRepositoryBranchInfo([]BranchInfo{defBranchInfo}, pageinfodef),
				},
			})
		case 2:
			// Stale
			c.JSON(http.StatusOK, gin.H{
				provider: gin.H{
					"stale":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(filterStale(branches), page, 20)),
					"yours":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(yourbranches, page, 1)),
					"default": BuildRepositoryBranchInfo([]BranchInfo{defBranchInfo}, pageinfodef),
				},
			})
		case 3:
			// All
			c.JSON(http.StatusOK, gin.H{
				provider: gin.H{
					"all":     BuildRepositoryBranchInfo(pageinfo.PaginateSlice(branches, page, 20)),
					"yours":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(yourbranches, page, 1)),
					"default": BuildRepositoryBranchInfo([]BranchInfo{defBranchInfo}, pageinfodef),
				},
			})
		default:
			// Yours
			c.JSON(http.StatusOK, gin.H{
				provider: gin.H{
					"yours":   BuildRepositoryBranchInfo(pageinfo.PaginateSlice(yourbranches, page, 20)),
					"default": BuildRepositoryBranchInfo([]BranchInfo{defBranchInfo}, pageinfodef),
				},
			})
		}
		return nil
	})

	if err != nil {
		log.Printf("Access of repository failed: %v", err)
	}
}
