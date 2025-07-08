package github

type GitHubRepositoryIssuesResponse struct {
	Data struct {
		Repository struct {
			Issues struct {
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
					Author    struct {
						Login string `json:"login"`
					} `json:"author"`
					Labels struct {
						Nodes []struct {
							Name string `json:"name"`
						} `json:"nodes"`
					} `json:"labels"`
					Comments struct {
						TotalCount int `json:"totalCount"`
					} `json:"comments"`
				} `json:"nodes"`
			} `json:"issues"`
		} `json:"repository"`
	} `json:"data"`
}

var GithubRepositoryIssuesQuery = `
query GetRepositoryIssues($owner: String!, $name: String!, $first: Int, $after: String, $last: Int, $before: String, $field: IssueOrderField, $direction: OrderDirection) {
  repository(owner: $owner, name: $name) {
    issues(
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
        labels(first: 5) {
          nodes {
            name
          }
        }
        comments {
          totalCount
        }
      }
    }
  }
}`
