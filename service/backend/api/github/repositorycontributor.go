package github

type RepositoryContributorNodeFromAPI struct {
	Login         string `json:"login"`
	Contributions int    `json:"contributions"`
	AvatarURL     string `json:"avatar_url"`
	HTMLURL       string `json:"html_url"`
}

type RepositoryContributorNode struct {
	Login         string `json:"login"`
	Contributions int    `json:"contributions"`
	AvatarUrl     string `json:"avatarUrl"`
	HtmlUrl       string `json:"htmlUrl"`
}

type RepositoryContributor struct {
	TotalCount int                         `json:"totalCount"`
	Nodes      []RepositoryContributorNode `json:"nodes"`
}
