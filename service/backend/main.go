package main

import (
	"githubclone-backend/db"
	"githubclone-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	db.InitDB()
	models.AutoMigrate(db.DB)

	r := gin.Default()

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/users", func(c *gin.Context) {
		var users []models.User
		db.DB.Find(&users)
		c.JSON(200, users)
	})
	r.Static("/static", "./static")
	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html") // Next.js takes care of finding illegal pages
	})

	r.Run("0.0.0.0:8080")
}
