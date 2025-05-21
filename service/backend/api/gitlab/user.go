package gitlab

type GitLabUser struct {
	Data struct {
		CurrentUser struct {
			ID        string `json:"id"`
			Username  string `json:"username"`    // User name
			Name      string `json:"name"`        // Full name
			Email     string `json:"publicEmail"` // Public E-Mail (if available)
			Bio       string `json:"bio"`         // Description / Biography
			AvatarURL string `json:"avatarUrl"`   // Avatar-Picture
			CreatedAt string `json:"createdAt"`   // Creation date of the account
			Location  string `json:"location"`    // User location
			WebURL    string `json:"webUrl"`      // Profile-URL
		} `json:"currentUser"`
	} `json:"data"`
}

var GitLabUserQuery = `
{
    currentUser {
        id
        username
        name
        publicEmail
        bio
        avatarUrl
        location
        webUrl
        createdAt
    }
}`
