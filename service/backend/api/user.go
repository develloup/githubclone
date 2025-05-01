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

type updateuserType struct {
	ID          uint    `json:"userid"`
	Email       *string `json:"email"`
	Description *string `json:"description"`
}

type userType []struct {
	ID          uint   `json:"userid"`
	Username    string `json:"username"`
	Email       string `json:"email"`
	Description string `json:"description"`
}

type UserInput struct {
	Username       string              `json:"username" binding:"required"`
	Email          string              `json:"email" binding:"required,email"`
	PasswordExpiry time.Time           `json:"passwordExpiry"`
	Description    string              `json:"description"`
	Deactivated    bool                `json:"deactivated"`
	PasswordSet    bool                `json:"passwordSet"`
	UserType       string              `json:"type" binding:"required"`
	Permissions    []models.Permission `json:"permissions"`
}

func convertToUser(input UserInput) models.User {
	tnow := time.Now()
	user := models.User{
		Username:       input.Username,
		Email:          input.Email,
		PasswordHash:   "",
		CreatedAt:      tnow,                 // Set current time
		UpdatedAt:      tnow,                 // identical for first update
		PasswordExpiry: input.PasswordExpiry, // Set in half a year
		Description:    input.Description,
		Deactivated:    input.Deactivated,
		Deletable:      true,
		PasswordSet:    input.PasswordSet,
		UserType:       input.UserType,
	}
	return user
}

func CreateUser(c *gin.Context) {
	var userInput UserInput
	if err := c.ShouldBindJSON(&userInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := convertToUser(userInput)

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var existing models.User
		if err := tx.Unscoped().Where("username = ?", userInput.Username).First(&existing).Error; err == nil {
			if existing.DeletedAt.Valid {
				if err := tx.Unscoped().Delete(&existing).Error; err != nil {
					return err
				}
			} else {
				return fmt.Errorf("user with the same username already exists")
			}
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		for _, permissionName := range userInput.Permissions {
			var permission models.Permission
			if err := tx.Where("name = ?", permissionName.Name).First(&permission).Error; err != nil {
				return fmt.Errorf("invalid permission: %s", permissionName.Name)
			}

			userPermission := models.UserPermission{
				UserID:       user.ID,
				PermissionID: permission.ID,
				CreatedAt:    time.Now(),
			}

			if err := tx.Create(&userPermission).Error; err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		if err.Error() == "User with the same username already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "User created successfully.",
		"user":        user,
		"permissions": userInput.Permissions,
	})
}

func UpdateUser(c *gin.Context) {
	var userInput updateuserType

	id := c.Param("id")
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User

		if err := tx.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return fmt.Errorf("user not found")
			}
			return fmt.Errorf("failed to retrieve user: %v", err)
		}
		if err := c.ShouldBindJSON(&userInput); err != nil {
			return fmt.Errorf("invalid input: %v", err)
		}
		if userInput.Email != nil {
			user.Email = *userInput.Email
		}
		if userInput.Description != nil {
			user.Description = *userInput.Description
		}
		if err := tx.Save(&user).Error; err != nil {
			return fmt.Errorf("failed to update user: %v", err)
		}
		return nil
	})

	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "user": userInput})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Where("user_id = ?", id).Delete(&models.UserConnection{}).Error; err != nil {
			return err
		}
		if err := tx.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return err
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
			return err
		}
		if err := tx.Where("user_id = ?", id).Delete(&models.UserPermission{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user permissions"})
			return err
		}
		if err := tx.Delete(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return err
		}
		return nil
	})

	if err != nil {
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func SetNewPassword(c *gin.Context) {

}

func ChangePassword(c *gin.Context) {

}

func GetUser(c *gin.Context) {
	var user userType
	id := c.Param("id")

	if err := db.DB.Model(&models.User{}).
		Clauses(clause.Locking{Strength: "FOR SHARE"}).
		Select("id, username, email, description").
		Where("id = ? AND deactivated = ?", id, false).
		First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		}
		return
	}
	c.JSON(http.StatusOK, user)
}

func GetAllUsers(c *gin.Context) {
	var users userType
	if err := db.DB.Model(&models.User{}).
		Clauses(clause.Locking{Strength: "FOR SHARE"}).
		Select("id, username, email, description").
		// Where("deactivated = ?", false).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func UserRoutes(r *gin.Engine) {
	r.POST("/users", CreateUser)
	r.PUT("/users/:id", UpdateUser)
	r.DELETE("/users/:id", DeleteUser)
	r.POST("/user/:id/password", SetNewPassword)
	r.PUT("/user/:id/password", ChangePassword)
	r.GET("/users/:id", GetUser)
	r.GET("/users", GetAllUsers)
}
