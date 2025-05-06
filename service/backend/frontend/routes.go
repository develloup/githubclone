package frontend

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Routes(r *gin.Engine) {
	r.Static("/static", "./static")
	r.GET("/", func(c *gin.Context) {
		c.File("./static/index.html")
	})
	r.GET("/login", func(c *gin.Context) {
		c.File("./static/login.html")
	})

	r.NoRoute(func(c *gin.Context) {
		path := "./static" + c.Request.URL.Path
		if _, err := http.Dir("./static").Open(c.Request.URL.Path); err == nil {
			c.File(path) // Datei existiert
		} else {
			c.File("./static/index.html") // Next.js übernimmt Routing
		}
	})
}
