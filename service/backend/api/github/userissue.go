package github

type GitHubUserIssues struct {
	Data struct {
		Viewer struct {
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
					ClosedAt  string `json:"closedAt,omitempty"` // Optionales Feld, falls die Issue geschlossen ist
					Comments  struct {
						TotalCount int `json:"totalCount"`
					} `json:"comments"`
					Repository struct {
						Name  string `json:"name"`
						Owner struct {
							Login string `json:"login"`
						} `json:"owner"`
					} `json:"repository"`
				} `json:"nodes"`
			} `json:"issues"`
		} `json:"viewer"`
	} `json:"data"`
}

var GithubUserIssuesQuery string = `
	query GetViewerIssues($first: Int, $after: String, $last: Int, $before: String, $field: IssueOrderField, $direction: OrderDirection) {
		viewer {
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
					repository {
						name
						owner {
							login
						}
					}
					createdAt
					updatedAt
					closedAt
					comments {
						totalCount
					}
				}
			}
		}
	}`
