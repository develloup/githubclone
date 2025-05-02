package api

import (
	"fmt"
	"githubclone-backend/config"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Konfigurationswert abrufen
func GetConfig(c *gin.Context) {
	key := c.Param("key")
	value, err := config.GetConfiguration(key)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"key": key, "value": value})
}

func GetMultipleConfigs(c *gin.Context) {
	var req struct {
		Keys []string `json:"keys"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	response := make(map[string]string)
	var errors []string

	for _, key := range req.Keys {
		value, err := config.GetConfiguration(key)
		if err != nil {
			errors = append(errors, fmt.Sprintf("error at key '%s': %s", key, err.Error()))
			response[key] = "error"
		} else {
			response[key] = value
		}
	}
	if len(errors) > 0 {
		c.JSON(http.StatusPartialContent, gin.H{"data": response, "errors": strings.Join(errors, "; ")})
		return
	}
	c.JSON(http.StatusOK, response)
}

func SetConfig(c *gin.Context) {
	var req struct {
		Key   string `json:"key"`
		Value string `json:"value"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.SetConfiguration(req.Key, req.Value); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "configuration saved"})
}

func ConfigurationRoutes(r *gin.Engine) {
	r.GET("/config/:key", GetConfig)
	r.POST("/config", SetConfig)
	r.POST("/config/multiple", GetMultipleConfigs)
}
