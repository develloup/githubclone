package github

type GitHubUser struct {
	Data struct {
		Viewer struct {
			Login      string `json:"login"`      // User name
			Name       string `json:"name"`       // Full name
			Email      string `json:"email"`      // Public E-Mail (if available)
			Bio        string `json:"bio"`        // Decription / Biography
			AvatarURL  string `json:"avatarUrl"`  // Avatar-Picture
			CreatedAt  string `json:"createdAt"`  // Creation date of the account
			Company    string `json:"company"`    // Company or Organization
			Location   string `json:"location"`   // User location
			WebsiteURL string `json:"websiteUrl"` // Personal web site
		} `json:"viewer"`
	} `json:"data"`
}

var GithubUserQuery string = `{
    viewer {
        login
        name
        email
        bio
        avatarUrl
		createdAt
        company
        location
        websiteUrl
    }
}`
