package abstracted

import "github.com/gin-gonic/gin"

func SetupRoutes(router *gin.Engine) {
	router.GET("/api/oauth/loggedinuser", GetOAuthUser)
	router.GET("/api/oauth/repositories", GetOAuthRepositories)
	router.GET("/api/oauth/repository", GetOAuthRepository)
	router.GET("/api/oauth/repositorycontents", GetOauthRepositoryContentsAsync)
	// router.GET("/api/oauth/repositorycontents", GetOauthRepositoryContents)
	router.GET("/api/oauth/repositorycontributors", GetOAuthRepositoryContributors)
	router.GET("/api/oauth/repositorybranchcommit", GetOAuthRepositoryBranchCommit)
	router.GET("/api/oauth/repositorycontent", GetOAuthRepositoryContent)
}
