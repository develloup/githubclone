package github

type GitHubRepository struct {
	Data struct {
		Viewer struct {
			AvatarURL    string `json:"avatarUrl"`
			Repositories struct {
				PageInfo struct {
					HasNextPage     bool   `json:"hasNextPage"`
					HasPreviousPage bool   `json:"hasPreviousPage"`
					EndCursor       string `json:"endCursor"`
					StartCursor     string `json:"startCursor"`
				} `json:"pageInfo"`
				Nodes []struct {
					Name           string `json:"name"`
					Description    string `json:"description"`
					URL            string `json:"url"`
					IsPrivate      bool   `json:"isPrivate"`
					CreatedAt      string `json:"createdAt"`
					UpdatedAt      string `json:"updatedAt"`
					StargazerCount int    `json:"stargazerCount"`
					ForkCount      int    `json:"forkCount"`
				} `json:"nodes"`
			} `json:"repositories"`
		} `json:"viewer"`
	} `json:"data"`
}

var GithubRepositoryQuery string = `query GetRepositories(
  $first: Int,
  $after: String,
  $last: Int,
  $before: String,
  $field: RepositoryOrderField!,
  $direction: OrderDirection!
) {
  viewer {
    avatarUrl
    repositories(
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
        name
        description
        url
        isPrivate
        isFork
        createdAt
        updatedAt
        pushedAt
        stargazerCount
        forkCount
      }
    }
  }
}`
