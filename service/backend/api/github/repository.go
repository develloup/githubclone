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

type RepositoryDefaultBranch struct {
	Name string `json:"name"`
}

type ExtendedRepository struct {
	RepositoryNode
	Owner            RepositoryOwner         `json:"owner"`
	DefaultBranchRef RepositoryDefaultBranch `json:"defaultBranchRef"`
	Languages        RepositoryLanguages     `json:"languages"`
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

type Language struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type LanguageEdge struct {
	Size int      `json:"size"`
	Node Language `json:"node"`
}

type RepositoryLanguages struct {
	TotalSize int            `json:"totalSize"`
	Edges     []LanguageEdge `json:"edges"`
}

type LicenseInfo struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	Nickname string `json:"nickname"`
}

type RepositoryMeta struct {
	Name     string `json:"name"`
	Branches struct {
		TotalCount int `json:"totalCount"`
	} `json:"refs"`
	Tags struct {
		TotalCount int `json:"totalCount"`
	} `json:"tags"`
	Releases struct {
		TotalCount int `json:"totalCount"`
	} `json:"releases"`
	LicenseInfo *LicenseInfo `json:"licenseInfo"`
	Watchers    struct {
		TotalCount int `json:"totalCount"`
	} `json:"watchers"`
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
    defaultBranchRef {
      name
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
  }
}`

var GithubRepositoryMeta string = `query GetRepositoryMeta(
  $owner: String!,
  $name: String!
  ) {
  repository(owner: $owner, name: $name) {
    name
    refs(refPrefix: "refs/heads/") {
      totalCount
    }
    tags: refs(refPrefix: "refs/tags/") {
      totalCount
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
