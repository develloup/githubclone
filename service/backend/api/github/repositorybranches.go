package github

import (
	"githubclone-backend/api/common"
)

type CompareResponse struct {
	AheadBy  int `json:"ahead_by"`
	BehindBy int `json:"behind_by"`
}

type RepositoryBranchInfo struct {
	Data struct {
		Repository struct {
			Refs struct {
				PageInfo common.PageInfoNext `json:"pageInfo"`
				Nodes    []struct {
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
				} `json:"nodes"`
			} `json:"refs"`
			BranchProtectionRules struct {
				Nodes []struct {
					Pattern                      string `json:"pattern"`
					RequiresApprovingReviews     bool   `json:"requiresApprovingReviews"`
					RequiredApprovingReviewCount int    `json:"requiredApprovingReviewCount"`
					IsAdminEnforced              bool   `json:"isAdminEnforced"`
				} `json:"nodes"`
			} `json:"branchProtectionRules"`
		} `json:"repository"`
	} `json:"data"`
}

var GithubRepositoryBranchesQuery = `query GetBranches($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    refs(refPrefix: "refs/heads/", first: $first) {
	  pageInfo {
	    hasNextPage
		endCursor
	  }
      nodes {
        name
        target {
          ... on Commit {
		  	author {
			  name
			  user {
			    login
			  }
			}
            committedDate
            checkSuites(first: 1) {
              nodes {
                status
                conclusion
              }
            }
            associatedPullRequests(first: 1) {
              totalCount
            }
          }
        }
      }
    }
    branchProtectionRules(first: 5) {
      nodes {
        pattern
        requiresApprovingReviews
        requiredApprovingReviewCount
        isAdminEnforced
      }
    }
  }
}
`

type BranchInfoRest struct {
	Name   string `json:"name"`
	Commit struct {
		SHA string `json:"sha"`
	} `json:"commit"`
	Protected bool `json:"protected"`
}
