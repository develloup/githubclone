package api

import (
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserConnectionInput struct {
	UserID       uint `json:"userid" binding:"required"`
	ConnectionID uint `json:"connectionid" binding:"required"`
}

func convertToUserConnection(input UserConnectionInput) models.UserConnection {
	tnow := time.Now()
	userConnection := models.UserConnection{
		UserID:       input.UserID,
		ConnectionID: input.ConnectionID,
		CreatedAt:    tnow,
	}
	return userConnection
}

func CreateUserConnection(c *gin.Context) {
	var userConnectionInput UserConnectionInput

	if err := c.ShouldBindJSON(&userConnectionInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	userConnection := convertToUserConnection(userConnectionInput)

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, userConnection.UserID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("user not found")
			}
			return fmt.Errorf("failed to retrieve user: %v", err)
		}

		var connection models.Connection
		if err := tx.First(&connection, userConnection.ConnectionID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("connection not found")
			}
			return fmt.Errorf("failed to retrieve connection: %v", err)
		}

		if err := tx.Create(&userConnection).Error; err != nil {
			return fmt.Errorf("failed to create user connection: %v", err)
		}

		return nil
	})
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "connection not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message":        "User connection created successfully",
		"userConnection": userConnection,
	})
}

func DeleteUserConnection(c *gin.Context) {
	userID := c.Param("userId")
	connectionID := c.Param("connectionId")

	if err := db.DB.Where("user_id = ? AND connection_id = ?", userID, connectionID).
		Delete(&models.UserConnection{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete UserConnection"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "UserConnection deleted successfully"})
}

func GetUserConnections(c *gin.Context) {
	userID := c.Param("userId")

	var connections []models.Connection
	if err := db.DB.Model(&models.User{}).
		Clauses(clause.Locking{Strength: "FOR SHARE"}).
		Where("id = ?", userID).
		Association("Connections").Find(&connections); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch connections"})
		return
	}

	c.JSON(http.StatusOK, connections)
}

func GetAllUserConnections(c *gin.Context) {
	userID := c.Param("userId")

	var userConnections []UserConnectionInput
	if err := db.DB.Model(&models.UserConnection{}).
		Clauses(clause.Locking{Strength: "FOR SHARE"}).
		Select("user_id, connection_id").
		Where("user_id = ?", userID).
		Find(&userConnections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch UserConnections"})
		return
	}
	c.JSON(http.StatusOK, userConnections)
}

func UserConnectionRoutes(r *gin.Engine) {
	r.POST("/user-connections", CreateUserConnection)
	r.GET("/user-connections/:userId", GetUserConnections)
	r.DELETE("/user-connections/:userId/:connectionId", DeleteUserConnection)
	r.GET("/user-connections/:userId/all", GetAllUserConnections)
}
