package abstracted

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"githubclone-backend/api/common"
	"githubclone-backend/api/github"
	"githubclone-backend/gitcache"

	"github.com/gin-gonic/gin"
	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
)

type BranchInfo struct {
	Name       string    `json:"name"`
	CommitHash string    `json:"commit"`
	CommitDate time.Time `json:"date"`
}

func getSortedBranches(repoPath string, islog bool) ([]BranchInfo, error) {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open repo: %w", err)
	}

	refs, err := repo.References()
	if err != nil {
		return nil, fmt.Errorf("failed to list refs: %w", err)
	}

	var branches []BranchInfo

	err = refs.ForEach(func(ref *plumbing.Reference) error {
		if !ref.Name().IsRemote() || !strings.HasPrefix(ref.Name().String(), "refs/remotes/origin/") {
			return nil
		}
		if islog {
			log.Printf("foreach: %v", ref)
		}
		commit, err := repo.CommitObject(ref.Hash())
		if err != nil {
			return nil
		}

		branches = append(branches, BranchInfo{
			Name:       ref.Name().Short(),
			CommitHash: commit.Hash.String(),
			CommitDate: commit.Committer.When,
		})

		return nil
	})

	if err != nil {
		return nil, err
	}

	sort.Slice(branches, func(i, j int) bool {
		return branches[i].CommitDate.After(branches[j].CommitDate)
	})

	if islog {
		log.Printf("branches: %v", branches)
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
	islog := true
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
