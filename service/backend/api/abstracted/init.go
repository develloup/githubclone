package abstracted

import "github.com/gin-gonic/gin"

func SetupRoutes(router *gin.Engine) {
	router.GET("/api/oauth/loggedinuser", GetOAuthUser)
}
