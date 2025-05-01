package api

import (
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ConnectionInput struct {
	ConnectionName string  `json:"username" binding:"required"`
	Type           string  `json:"type" binding:"required"`
	URL            *string `json:"url"`
	ClientID       string  `json:"clientid" binding:"required"`
	ClientSecret   string  `json:"clientsecret" binding:"required"`
}

func CreateConnection(c *gin.Context) {
	var connection models.Connection
	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&connection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, connection)
}

func UpdateConnection(c *gin.Context) {
	var connection models.Connection
	id := c.Param("id")

	if err := db.DB.First(&connection, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection not found"})
		return
	}

	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Save(&connection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, connection)
}

func DeleteConnection(c *gin.Context) {
	var connection models.Connection
	id := c.Param("id")
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("connection_id = ?", id).Delete(&models.UserConnection{}).Error; err != nil {
			return err
		}
		if err := db.DB.Delete(&connection, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return err
		}
		return nil
	})
	if err != nil {
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Connection deleted"})
}

func GetConnection(c *gin.Context) {
	var connection ConnectionInput
	id := c.Param("id")

	if err := db.DB.Model(&models.Connection{}).
		Select("id, connectionname, type, url, clientid, clientsecret").
		Where("id = ?", id).First(&connection).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Connection not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve connection"})
		}
		return
	}
	c.JSON(http.StatusOK, connection)
}

func GetAllConnections(c *gin.Context) {
	var connections []models.Connection

	if err := db.DB.Find(&connections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, connections)
}

func ConnectionRoutes(r *gin.Engine) {
	r.POST("/connections", CreateConnection)
	r.PUT("/connections/:id", UpdateConnection)
	r.DELETE("/connections/:id", DeleteConnection)
	r.GET("/connections/:id", GetConnection)
	r.GET("/connections", GetAllConnections)
}
