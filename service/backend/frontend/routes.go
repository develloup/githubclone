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
	r.NoRoute(func(c *gin.Context) {
		path := "./static" + c.Request.URL.Path
		if _, err := http.Dir("./static").Open(c.Request.URL.Path); err == nil {
			c.File(path) // deliver static file
		} else {
			c.File("./static/index.html") // Next.js takes care of finding illegal pages
		}
	})
}
