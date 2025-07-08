package github

type RepositoryCommitAsync struct {
	Oid string `json:"oid"`
}
type RepositoryDefaultBranchAsync struct {
	Name   string                `json:"name"`
	Target RepositoryCommitAsync `json:"target"`
}

type ExtendedRepositoryAsync struct {
	RepositoryNode
	Owner            RepositoryOwner              `json:"owner"`
	Languages        RepositoryLanguages          `json:"languages"`
	DefaultBranchRef RepositoryDefaultBranchAsync `json:"defaultBranchRef"`
	Branches         RepositoryBranches           `json:"branches"`
	Tags             RepositoryTags               `json:"tags"`
	Releases         RepositoryReleases           `json:"releases"`
	Deployments      RepositoryDeployments        `json:"deployments"`
	LicenseInfo      RepositoryLicenseInfo        `json:"licenseInfo"`
	Watchers         RepositoryWatchers           `json:"watchers"`
}

// GithubRepositoryAsyncQuery retrieves metadata about a GitHub repository,
// including structural, social, and technical attributes.
//
// This query returns:
//   - Basic info: name, description, URL, creation/update timestamps
//   - Repository status: isArchived, isPrivate, isFork, parent info (if forked)
//   - Git activity: pushedAt, stargazerCount, forkCount, watchers
//   - Owner avatar: for UI display
//   - Languages used: top 10 by size, with color and byte size
//   - Default branch: name and latest commit SHA (oid)
//   - Branches: up to 9 recent branches (by commit date)
//   - Tags: up to 10 recent tags (by commit date)
//   - Releases: latest release info (name, tag, createdAt, isDraft, isLatest)
//   - Deployments: latest deployment info (createdAt, state, ref, environment)
//   - License: key, name, nickname
//
// Notes:
//   - Pagination is not included; only limited recent branches/tags/releases/deployments are returned.
//   - To fetch full commit info, you must expand `target` with additional fragments.
//   - This query does not include file contents or tree structure – use `object(expression: "...")` for that.
const GithubRepositoryAsyncQuery string = `query GetRepository(
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
      target {
        ... on Commit {
          oid
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
