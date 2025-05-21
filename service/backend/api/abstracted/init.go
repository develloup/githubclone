package abstracted

import "github.com/gin-gonic/gin"

func SetupRoutes(router *gin.Engine) {
	router.GET("/api/oauth/loggedinuser", GetOAuthUser)
	router.GET("/api/oauth/repositories", GetOAuthRepositories)
}
