package github

import (
	"githubclone-backend/api/common"
)

type GitHubRepositoriesOfViewer struct {
	Data struct {
		Viewer struct {
			AvatarURL    string `json:"avatarUrl"`
			Repositories struct {
				PageInfo common.PageInfo  `json:"pageInfo"`
				Nodes    []RepositoryNode `json:"nodes"`
			} `json:"repositories"`
		} `json:"viewer"`
	} `json:"data"`
}

type RepositoryNode struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	URL            string `json:"url"`
	IsPrivate      bool   `json:"isPrivate"`
	IsFork         bool   `json:"isFork"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	PushedAt       string `json:"pushedAt"`
	StargazerCount int    `json:"stargazerCount"`
	ForkCount      int    `json:"forkCount"`
}

type RepositoryOwner struct {
	AvatarURL string `json:"avatarUrl"`
}

type RepositoryLanguage struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type RepositoryLanguageEdge struct {
	Size int                `json:"size"`
	Node RepositoryLanguage `json:"node"`
}

type RepositoryLanguages struct {
	TotalSize int                      `json:"totalSize"`
	Edges     []RepositoryLanguageEdge `json:"edges"`
}

type RepositoryDefaultBranch struct {
	Name string `json:"name"`
}

type RepositoryBranches struct {
	TotalCount int `json:"totalCount"`
	Nodes      []struct {
		Name string `json:"name"`
	} `json:"nodes"`
}

type RepositoryTags struct {
	TotalCount int `json:"totalCount"`
	Nodes      []struct {
		Name string `json:"name"`
	} `json:"nodes"`
}

type RepositoryReleases struct {
	TotalCount int `json:"totalCount"`
}

type RepositoryWatchers struct {
	TotalCount int `json:"totalCount"`
}

type RepositoryLicenseInfo struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	Nickname string `json:"nickname"`
}

type ExtendedRepository struct {
	RepositoryNode
	Owner            RepositoryOwner         `json:"owner"`
	Languages        RepositoryLanguages     `json:"languages"`
	DefaultBranchRef RepositoryDefaultBranch `json:"defaultBranchRef"`
	Branches         RepositoryBranches      `json:"branches"`
	Tags             RepositoryTags          `json:"tags"`
	Releases         RepositoryReleases      `json:"releases"`
	LicenseInfo      RepositoryLicenseInfo   `json:"licenseInfo"`
	Watchers         RepositoryWatchers      `json:"watchers"`
}

type RepositoryNodeWithAttributes struct {
	Data struct {
		Repository ExtendedRepository `json:"repository"`
	} `json:"data"`
}

type RepositoryTree struct {
	Data struct {
		Repository struct {
			Object struct {
				Entries []struct {
					Name string `json:"name"`
					Type string `json:"type"` // blob, tree, etc.
					Mode string `json:"mode"`
				} `json:"entries"`
			} `json:"object"`
		} `json:"repository"`
	} `json:"data"`
}

var GithubRepositoriesOfViewerQuery string = `query GetRepositories(
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

var GithubRepositoryQuery string = `query GetRepository(
  $owner: String!,
  $name: String!
) {
  repository(owner: $owner, name: $name) {
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
    owner {
      avatarUrl
    }
    languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
      totalSize
      edges {
        size
        node {
          name
          color
        }
      }
    }
    defaultBranchRef {
      name
    }
    branches: refs(
      refPrefix: "refs/heads/"
      first: 9
      orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
    ) {
      totalCount
      nodes {
        name
      }
    }
    tags: refs(
      refPrefix: "refs/tags/"
      first: 10
      orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
    ) {
      totalCount
      nodes {
        name
      }
    }
    releases {
      totalCount
    }
    licenseInfo {
      key
      name
      nickname
    }
    watchers {
      totalCount
    }
  }
}`

var GithubRepositoryContentsQuery string = `query GetRepositoryContents(
    $owner: String!,
    $name: String!,
    $expression: String!
  ) {
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        ... on Tree {
          entries {
            name
            type
            mode
          }
        }
      }
    }
  }
`

var GithubRepositoryBranches string = `query GetRepositoryBranches(
  $owner: String!,
  $name: String!
  $first: Int,
  $after: String,
  $last: Int,
  $before: String,
) {
  repository(owner: $owner, name: $name) {
    refs(
      refPrefix: "refs/heads/",
      first: $first,
      after: $after,
      last: $last,
      before: $before
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        name
        target {
          ... on Commit {
            committedDate
            author {
              user {
                login
              }
            }
          }
        }
      }
    }
    viewer {
      login
    }
  }
}
`
