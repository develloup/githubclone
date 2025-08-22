package github

import "githubclone-backend/api/common"

type RepositoryTagInfoNode struct {
	Name   string `json:"name"`
	Target struct {
		CommittedDate string `json:"committedDate"`
	} `json:"target"`
}

type RepositoryTagInfo struct {
	Data struct {
		Repository struct {
			Refs struct {
				PageInfo common.PageInfoNext     `json:"pageInfo"`
				Nodes    []RepositoryTagInfoNode `json:"nodes"`
			} `json:"refs"`
		} `json:"repository"`
	} `json:"data"`
}
