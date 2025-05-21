package github

type GitHubRepositoryPullRequestsResponse struct {
	Data struct {
		Repository struct {
			PullRequests struct {
				PageInfo struct {
					HasNextPage     bool   `json:"hasNextPage"`
					HasPreviousPage bool   `json:"hasPreviousPage"`
					StartCursor     string `json:"startCursor"`
					EndCursor       string `json:"endCursor"`
				} `json:"pageInfo"`
				Nodes []struct {
					Title     string `json:"title"`
					Number    int    `json:"number"`
					Body      string `json:"body"`
					State     string `json:"state"`
					CreatedAt string `json:"createdAt"`
					UpdatedAt string `json:"updatedAt"`
					ClosedAt  string `json:"closedAt,omitempty"`
					MergedAt  string `json:"mergedAt,omitempty"`
					Author    struct {
						Login string `json:"login"`
					} `json:"author"`
					Comments struct {
						TotalCount int `json:"totalCount"`
					} `json:"comments"`
					Commits struct {
						Nodes []struct {
							Commit struct {
								Message       string `json:"message"`
								CommittedDate string `json:"committedDate"`
								Author        struct {
									Name string `json:"name"`
								} `json:"author"`
							} `json:"commit"`
						} `json:"nodes"`
					} `json:"commits"`
				} `json:"nodes"`
			} `json:"pullRequests"`
		} `json:"repository"`
	} `json:"data"`
}

var GithubRepositoryPullRequestsQuery = `
query GetRepositoryPullRequests($owner: String!, $name: String!, $first: Int, $after: String, $last: Int, $before: String, $field: PullRequestOrderField, $direction: OrderDirection) {
  repository(owner: $owner, name: $name) {
    pullRequests(
      first: $first
      after: $after
      last: $last
      before: $before
      orderBy: { field: $field, direction: $direction }
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        number
        body
        state
        author {
          login
        }
        createdAt
        updatedAt
        closedAt
        mergedAt
        comments {
          totalCount
        }
        commits(first: 5) {
          nodes {
            commit {
              message
              committedDate
              author {
                name
              }
            }
          }
        }
      }
    }
  }
}
`
