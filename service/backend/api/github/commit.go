package github

type ResponseCommitsCompare struct {
	AheadBy         int    `json:"ahead_by"`
	BehindBy        int    `json:"behind_by"`
	Status          string `json:"status"`
	MergeBaseCommit struct {
		SHA string `json:"sha"`
	} `json:"merge_base_commit"`
}

type CommitsCompareResult struct {
	Source       string `json:"source"`
	Target       string `json:"target"`
	AheadBy      int    `json:"ahead_by"`
	BehindBy     int    `json:"behind_by"`
	Status       string `json:"status"`
	MergeBaseSHA string `json:"merge_base_sha"`
}
