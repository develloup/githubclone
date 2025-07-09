package github

import (
	"githubclone-backend/api/common"
)

type GitHubFile struct {
	Content string `json:"content"`
	MIME    string `json:"mime"`
}

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
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
	IsArchived  bool   `json:"isArchived"`
	IsPrivate   bool   `json:"isPrivate"`
	IsFork      bool   `json:"isFork"`
	Parent      *struct {
		NameWithOwner    string                  `json:"nameWithOwner"`
		URL              string                  `json:"url"`
		DefaultBranchRef RepositoryDefaultBranch `json:"defaultBranchRef"`
	} `json:"parent"`
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
	Nodes      []struct {
		Name      string `json:"name"`
		TagName   string `json:"tagName"`
		CreatedAt string `json:"createdAt"`
		IsDraft   bool   `json:"isDraft"`
		IsLatest  bool   `json:"isLatest"`
	} `json:"nodes"`
}

type RepositoryDeployments struct {
	TotalCount int `json:"totalCount"`
	Nodes      []struct {
		CreatedAt   string `json:"createdAt"`
		State       string `json:"state"`
		Environment string `json:"environment"`
		Ref         struct {
			Name string `json:"name"`
		} `json:"ref"`
	} `json:"nodes"`
}

type RepositoryCollaborators struct {
	TotalCount int `json:"totalCount"`
	Nodes      []struct {
		Login           string `json:"login"`
		Name            string `json:"name"`
		AvatarURL       string `json:"avatarUrl"`
		URL             string `json:"url"`
		Bio             string `json:"bio"`
		Company         string `json:"company"`
		Location        string `json:"location"`
		WebsiteURL      string `json:"websiteUrl"`
		TwitterUsername string `json:"twitterUsername"`
		IsSiteAdmin     bool   `json:"isSiteAdmin"`
	} `json:"nodes"`
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
	Deployments      RepositoryDeployments   `json:"deployments"`
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

type RepositoryEntryTreeCommit struct {
	Name          string `json:"name"`
	Type          string `json:"type"` // blob, tree, etc.
	Mode          string `json:"mode"`
	Oid           string `json:"oid"`
	Message       string `json:"message"`
	CommittedDate string `json:"committedDate"`
}

type RepositoryTreeCommit struct {
	Data struct {
		Repository struct {
			Object struct {
				Entries []RepositoryEntryTreeCommit `json:"entries"`
			} `json:"object"`
		} `json:"repository"`
	} `json:"data"`
	Partial bool `json:"partial"`
}

type RepositoryBranchCommit struct {
	Data struct {
		Repository struct {
			Ref struct {
				Target struct {
					OID             string `json:"oid"`
					CommittedDate   string `json:"committedDate"`
					MessageHeadline string `json:"messageHeadline"`
					Author          struct {
						Name  string `json:"name"`
						Email string `json:"email"`
						User  *struct {
							Login     string `json:"login"`
							AvatarURL string `json:"avatarUrl"`
							URL       string `json:"url"`
						} `json:"user"`
					} `json:"author"`
					Signature *struct {
						IsValid   bool   `json:"isValid"`
						Payload   string `json:"payload"`
						Signature string `json:"signature"`
						Signer    *struct {
							Name  string `json:"name"`
							Email string `json:"email"`
						} `json:"signer"`
					} `json:"signature"`
					CheckSuites struct {
						TotalCount int `json:"totalCount"`
						Nodes      []struct {
							Status     string `json:"status"`
							Conclusion string `json:"conclusion"`
							App        struct {
								Name string `json:"name"`
							} `json:"app"`
						} `json:"nodes"`
					} `json:"checkSuites"`
					History struct {
						TotalCount int `json:"totalCount"`
					} `json:"history"`
				} `json:"target"`
			} `json:"ref"`
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
    isArchived
    isPrivate
    isFork
    parent {
      nameWithOwner
      url
      defaultBranchRef {
        name
      }
    }
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
    releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
      totalCount
      nodes {
        name
        tagName
        createdAt
        isDraft
        isLatest
      }
    }
    deployments(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
      totalCount
      nodes {
        createdAt
        state
        ref {
          name
        }
        environment
      }
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

// var GithubRepositoryBranches string = `query GetRepositoryBranches(
//   $owner: String!,
//   $name: String!
//   $first: Int,
//   $after: String,
//   $last: Int,
//   $before: String,
// ) {
//   repository(owner: $owner, name: $name) {
//     refs(
//       refPrefix: "refs/heads/",
//       first: $first,
//       after: $after,
//       last: $last,
//       before: $before
//     ) {
//       totalCount
//       pageInfo {
//         hasNextPage
//         hasPreviousPage
//         startCursor
//         endCursor
//       }
//       nodes {
//         name
//         target {
//           ... on Commit {
//             committedDate
//             author {
//               user {
//                 login
//               }
//             }
//           }
//         }
//       }
//     }
//     viewer {
//       login
//     }
//   }
// }
// `

// The `expression` parameter in the GraphQL query refers to a Git reference name.
// It can be one of the following:
// - A branch name (e.g. "main", "develop") or its fully qualified form (e.g. "refs/heads/main")
// - A tag name (e.g. "v1.0.0") or "refs/tags/v1.0.0"
// - A full commit SHA (e.g. "a1b2c3d4e5f6...")
//
// GitHub will resolve the reference to the corresponding object (usually a commit),
// which can then be used to access commit metadata like author, date, and CI check results.
var GithubRepositoryBranchCommitQuery = `query GetRepositoryBranchCommit(
  $owner: String!,
  $name: String!,
  $expression: String!
) {
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: $expression) {
      target {
        ... on Commit {
          oid
          committedDate
          messageHeadline
          author {
            name
            email
            user {
              login
              avatarUrl
              url
            }
          }
          signature {
            isValid
            payload
            signature
            signer {
              name
              email
            }
          }
          checkSuites(first: 1) {
            totalCount
            nodes {
              status
              conclusion
              app {
                name
              }
            }
          }
          history {
            totalCount
          }
        }
      }
    }
  }
}
`
