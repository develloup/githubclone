package frontend

import (
	"github.com/gin-gonic/gin"
)

// func isStaticFile(path string) bool {
// 	extensions := []string{".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".woff2", ".ttf", ".ico"}
// 	for _, ext := range extensions {
// 		if strings.HasSuffix(path, ext) {
// 			return true
// 		}
// 	}
// 	return false
// }

func Routes(r *gin.Engine) {
	// r.Use(func(c *gin.Context) {
	// 	requestPath := c.Request.URL.Path
	// 	if isStaticFile(requestPath) {
	// 		c.Next() // if it's a static file, just forward
	// 		return
	// 	}
	// 	if requestPath == "/login" {
	// 		c.Next()
	// 		return
	// 	}
	// 	sessionCookie, err := c.Cookie("session_id")

	// 	if err != nil || !api.IsValidSession(sessionCookie) {
	// 		// log.Printf("No valid session cookie, redirect to /login, sessionCookie=\"%s\" requestpath = %s", sessionCookie, requestPath)
	// 		c.Redirect(http.StatusFound, "/login")
	// 		c.Abort()
	// 		return
	// 	}
	// 	// log.Printf("Cookie is valid.")
	// 	c.Next() // User is logged in, continue
	// })

	// r.Static("/static", "./static")
	// r.GET("/", func(c *gin.Context) {
	// 	c.File("./static/index.html")
	// })

	// r.NoRoute(func(c *gin.Context) {
	// 	path := "./static" + c.Request.URL.Path
	// 	// log.Printf("path = %s", path)
	// 	if _, err := os.Stat(path); err == nil { // Checks if the file exists
	// 		c.File(path) // File exists, deliver
	// 	} else {
	// 		pathhtml := path + ".html"
	// 		// log.Printf("pathhtml = %s", pathhtml)
	// 		if _, err := os.Stat(pathhtml); err == nil {
	// 			c.File(pathhtml)
	// 		} else {
	// 			// log.Printf("File not found: neither %s nor %s", path, pathhtml)
	// 			c.Status(http.StatusNotFound)
	// 		}
	// 	}
	// })
}
