package api

import (
	"errors"
	"fmt"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type updateconnectionType struct {
	ID           uint    `json:"userid"`
	Type         *string `json:"type"`
	URL          *string `json:"url"`
	ClientID     *string `json:"clientid"`
	ClientSecret *string `json:"clientsecret"`
	Description  *string `json:"description"`
}

type connectionType struct {
	ID             uint   `json:"connectionid"`
	ConnectionName string `json:"name"`
	Type           string `json:"type"`
	ClientID       string `json:"clientid"`
	ClientSecret   string `json:"clientsecret"`
	Description    string `json:"description"`
}

type ConnectionInput struct {
	ConnectionName string  `json:"name" binding:"required"`
	Type           string  `json:"type" binding:"required"`
	URL            *string `json:"url"`
	ClientID       string  `json:"clientid" binding:"required"`
	ClientSecret   string  `json:"clientsecret" binding:"required"`
	Deactivated    bool    `json:"deactivated"`
	Description    string  `json:"description"`
}

func convertToConnection(input ConnectionInput) models.Connection {
	tnow := time.Now()
	connection := models.Connection{
		ConnectionName: input.ConnectionName,
		Type:           input.Type,
		CreatedAt:      tnow,
		UpdatedAt:      tnow,
		Description:    input.Description,
		ClientID:       input.ClientID,
		ClientSecret:   input.ClientSecret,
		Deactivated:    input.Deactivated,
	}
	return connection
}

func CreateConnection(c *gin.Context) {
	var connectionInput ConnectionInput
	if err := c.ShouldBindJSON(&connectionInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	connection := convertToConnection(connectionInput)

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var existing models.Connection
		if err := tx.Unscoped().Where("connection_name = ?", connectionInput.ConnectionName).First(&existing).Error; err == nil {
			if existing.DeletedAt.Valid {
				if err := tx.Unscoped().Delete(&existing).Error; err != nil {
					return err
				}
			} else {
				return fmt.Errorf("connection with the same name already exists")
			}
		}
		if err := tx.Create(&connection).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		if err.Error() == "connection with the same name already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message":    "connection created successfully.",
		"connection": connection,
	})
}

func UpdateConnection(c *gin.Context) {
	var connectionInput updateconnectionType
	var connectionInputNew updateconnectionType
	id := c.Param("id")
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var connection models.Connection
		if err := db.DB.First(&connection, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("connection not found")
			}
			return fmt.Errorf("failed to retrieve connection: %v", err)
		}

		if err := c.ShouldBindJSON(&connectionInput); err != nil {
			return fmt.Errorf("invalid input: %v", err)
		}
		if connectionInput.URL != nil {
			connection.URL = connectionInput.URL
		}
		if connectionInput.ClientID != nil {
			connection.ClientID = *connectionInput.ClientID
		}
		if connectionInput.ClientSecret != nil {
			connection.ClientSecret = *connectionInput.ClientSecret
		}
		if connectionInput.Description != nil {
			connection.Description = *connectionInput.Description
		}

		if err := tx.Save(&connection).Error; err != nil {
			return fmt.Errorf("failed to update connection: %v", err)
		}
		connectionInputNew.ID = connection.ID
		connectionInputNew.Type = &connection.Type
		connectionInputNew.URL = connection.URL
		connectionInputNew.ClientID = &connection.ClientID
		connectionInputNew.ClientSecret = &connection.ClientSecret
		connectionInputNew.Description = &connection.Description
		return nil
	})
	if err != nil {
		if err.Error() == "connection not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "connection updated successfully", "request": connectionInput, "connection": connectionInputNew})
}

func DeleteConnection(c *gin.Context) {
	var connection models.Connection
	id := c.Param("id")
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("connection_id = ?", id).Delete(&models.UserConnection{}).Error; err != nil {
			return err
		}
		if err := tx.First(&connection, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "connection not found"})
				return err
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve connection"})
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
	c.JSON(http.StatusOK, gin.H{"message": "connection deleted"})
}

func GetConnection(c *gin.Context) {
	var connection connectionType
	id := c.Param("id")

	if err := db.DB.Model(&models.Connection{}).
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("id, connection_name, type, url, client_id, client_secret, description").
		Where("id = ? AND deactivated = ?", id, false).
		First(&connection).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "connection not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve connection"})
		}
		return
	}
	c.JSON(http.StatusOK, connection)
}

func GetAllConnections(c *gin.Context) {
	var connections []connectionType
	excludeUserId := c.Query("exclude")

	query := db.DB.Model(&models.Connection{}).
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("id, connection_name, type, url, client_id, client_secret, description").
		Where("deactivated = ?", false)

	if excludeUserId != "" {
		// subquery: all connections, which are not linked to the user
		query = query.Where("id NOT IN (?)",
			db.DB.Table("user_connections").
				Select("connection_id").
				Where("user_id = ?", excludeUserId),
		)
	}
	if err := query.Find(&connections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve connections"})
		return
	}
	if len(connections) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no connections found"})
		return
	}
	c.JSON(http.StatusOK, connections)
}

func GetUsersForConnection(c *gin.Context) {
	connectionID := c.Param("id")

	var connection models.Connection
	if err := db.DB.First(&connection, connectionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "connection not found"})
		return
	}

	var userConnections []UserConnections

	query := db.DB.Table("user_connections").
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("user_connections.user_id, user_connections.connection_id, users.username AS user_name, connections.connection_name AS connection_name").
		Joins("JOIN users ON users.id = user_connections.user_id").
		Joins("JOIN connections ON connections.id = user_connections.connection_id").
		Where("user_connections.connection_id = ?", connectionID)
	err := query.Find(&userConnections).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while fetching user connections"})
		return
	}
	if len(userConnections) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No users found for this connection"})
		return
	}
	c.JSON(http.StatusOK, userConnections)

}

func ConnectionRoutes(r *gin.Engine) {
	r.POST("/api/connections", CreateConnection)
	r.PUT("/api/connections/:id", UpdateConnection)
	r.DELETE("/api/connections/:id", DeleteConnection)
	r.GET("/api/connections/:id", GetConnection)
	r.GET("/api/connections", GetAllConnections)
	r.GET("/api/connections/:id/users", GetUsersForConnection)
}
