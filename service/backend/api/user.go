package api

import (
	"errors"
	"fmt"
	"githubclone-backend/config"
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type updateuserType struct {
	ID          uint                 `json:"userid"`
	Email       *string              `json:"email"`
	Description *string              `json:"description"`
	Deactivated *bool                `json:"deactivated"`
	PasswordSet *bool                `json:"passwordset"`
	Deletable   *bool                `json:"deletable"`
	UserType    *string              `json:"type"`
	Permissions *[]models.Permission `json:"permissions"`
}

type userType struct {
	ID          uint   `json:"userid"`
	Username    string `json:"name"`
	Email       string `json:"email"`
	Description string `json:"description"`
}

type UserInput struct {
	Username    string              `json:"name" binding:"required"`
	Email       string              `json:"email" binding:"required,email"`
	Description string              `json:"description"`
	Deactivated bool                `json:"deactivated"`
	PasswordSet bool                `json:"passwordset"`
	UserType    string              `json:"type" binding:"required"`
	Permissions []models.Permission `json:"permissions"`
}

func convertToUser(input UserInput) models.User {
	tnow := time.Now()
	user := models.User{
		Username:       input.Username,
		Email:          input.Email,
		PasswordHash:   "",
		CreatedAt:      tnow, // Set current time
		UpdatedAt:      tnow, // identical for first update
		PasswordExpiry: nil,
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
				return fmt.Errorf("user with the same name already exists")
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
		if err.Error() == "user with the same name already exists" {
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
	var userInputNew updateuserType

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

		// Update of the fields (only if they are set)
		if userInput.Email != nil {
			user.Email = *userInput.Email
		}
		if userInput.Description != nil {
			user.Description = *userInput.Description
		}
		if userInput.Deactivated != nil {
			user.Deactivated = *userInput.Deactivated
		}
		if userInput.Deletable != nil {
			user.Deletable = *userInput.Deletable
		}
		if userInput.UserType != nil {
			user.UserType = *userInput.UserType
		}
		if userInput.PasswordSet != nil {
			user.PasswordSet = *userInput.PasswordSet
			if user.PasswordSet {
				user.PasswordHash = ""
			}
		}
		if userInput.Permissions != nil {
			// Update of the permissions
			if err := tx.Model(&user).Association("Permissions").Replace(userInput.Permissions); err != nil {
				return fmt.Errorf("failed to update user permissions: %v", err)
			}
		}

		// Save changes
		if err := tx.Save(&user).Error; err != nil {
			return fmt.Errorf("failed to update user: %v", err)
		}

		// Return updated values
		userInputNew.ID = user.ID
		userInputNew.Email = &user.Email
		userInputNew.Description = &user.Description
		userInputNew.Deactivated = &user.Deactivated
		userInputNew.Deletable = &user.Deletable
		userInputNew.UserType = &user.UserType

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
	c.JSON(http.StatusOK, gin.H{"message": "user updated successfully", "request": userInput, "user": userInputNew})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User

		if err := tx.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return err
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
			return err
		}

		if !user.Deletable {
			c.JSON(http.StatusForbidden, gin.H{"error": "user cannot be deleted"})
			return fmt.Errorf("user deletion not allowed")
		}

		if err := tx.Where("user_id = ?", id).Delete(&models.UserConnection{}).Error; err != nil {
			return err
		}

		if err := tx.Where("user_id = ?", id).Delete(&models.UserPermission{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user permissions"})
			return err
		}

		if err := tx.Delete(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
			return err
		}

		return nil
	})
	if err != nil {
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}

func SetInitialPassword(c *gin.Context) {
	userID := c.Param("id")

	err := db.DB.Transaction(func(tx *gorm.DB) error {

		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return fmt.Errorf("user not found")
		}

		if !user.Deactivated {
			return fmt.Errorf("initial password cannot be set to an inactivate user")
		}

		if !user.PasswordSet {
			return fmt.Errorf("initial password already set")
		}

		var request struct {
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			return fmt.Errorf("invalid request format")
		}
		if strings.TrimSpace(request.Password) == "" {
			return fmt.Errorf("password cannot be empty")
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("error hashing password")
		}
		user.PasswordHash = string(hashedPassword)
		user.PasswordSet = false

		passwordExpiryDaysStr, err := config.GetConfiguration("password_expiry_days")
		if err != nil {
			return fmt.Errorf("failed to retrieve password expiry configuration")
		}

		noPasswordExpirationStr, err := config.GetConfiguration("password_never_expires")
		if err != nil {
			return fmt.Errorf("failed to retrieve password expiration setting")
		}

		passwordExpiryDays, err := strconv.Atoi(passwordExpiryDaysStr)
		if err != nil {
			return fmt.Errorf("invalid password expiry configuration")
		}
		noPasswordExpiration := strings.ToLower(noPasswordExpirationStr) == "true"

		if noPasswordExpiration {
			user.PasswordExpiry = nil
		} else {
			expiryDate := time.Now().AddDate(0, 0, passwordExpiryDays)
			expiryDate = time.Date(expiryDate.Year(), expiryDate.Month(), expiryDate.Day(), 0, 0, 0, 0, expiryDate.Location())
			user.PasswordExpiry = &expiryDate
		}

		if err := tx.Save(&user).Error; err != nil {
			return fmt.Errorf("failed to set initial password")
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password successfully set"})
}

func UpdatePassword(c *gin.Context) {
	userID := c.Param("id")

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		// Benutzer abrufen
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return fmt.Errorf("user not found")
		}

		if user.PasswordSet {
			return fmt.Errorf("password update not allowed, initial password must be set first")
		}

		if user.Deactivated {
			return fmt.Errorf("cannot update password for deactivated user")
		}

		var request struct {
			OldPassword string `json:"oldpassword"`
			NewPassword string `json:"newpassword"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			return fmt.Errorf("invalid request format")
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.OldPassword)); err != nil {
			return fmt.Errorf("incorrect old password")
		}

		if strings.TrimSpace(request.NewPassword) == "" {
			return fmt.Errorf("new password cannot be empty")
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("error hashing password")
		}
		user.PasswordHash = string(hashedPassword)

		// Passwortablaufdatum aus Konfiguration holen
		passwordExpiryDaysStr, err := config.GetConfiguration("password_expiry_days")
		if err != nil {
			return fmt.Errorf("failed to retrieve password expiry configuration")
		}

		noPasswordExpirationStr, err := config.GetConfiguration("password_never_expires")
		if err != nil {
			return fmt.Errorf("failed to retrieve password expiration setting")
		}

		// Konfigurationswerte umwandeln
		passwordExpiryDays, err := strconv.Atoi(passwordExpiryDaysStr)
		if err != nil {
			return fmt.Errorf("invalid password expiry configuration")
		}

		noPasswordExpiration := strings.ToLower(noPasswordExpirationStr) == "true"

		// Passwortablaufdatum setzen (Immer um 0 Uhr)
		if noPasswordExpiration {
			user.PasswordExpiry = nil
		} else {
			expiryDate := time.Now().AddDate(0, 0, passwordExpiryDays)
			expiryDate = time.Date(expiryDate.Year(), expiryDate.Month(), expiryDate.Day(), 0, 0, 0, 0, expiryDate.Location())
			user.PasswordExpiry = &expiryDate
		}
		if err := tx.Save(&user).Error; err != nil {
			return fmt.Errorf("failed to update password")
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password successfully updated"})
}

func GetUser(c *gin.Context) {
	var user userType
	id := c.Param("id")

	if err := db.DB.Model(&models.User{}).
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("id, username, email, description").
		Where("id = ? AND deactivated = ?", id, false).
		First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
		}
		return
	}
	c.JSON(http.StatusOK, user)
}

func GetAllUsers(c *gin.Context) {
	var users []userType
	if err := db.DB.Model(&models.User{}).
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("id, username, email, description").
		Where("deactivated = ?", false).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}
	if len(users) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no users found"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func GetConnectionsForUser(c *gin.Context) {
	userID := c.Param("id")

	var user models.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var userConnections []UserConnections

	query := db.DB.Table("user_connections").
		Clauses(clause.Locking{Strength: "SHARE"}).
		Select("user_connections.user_id, user_connections.connection_id, users.username AS user_name, connections.connection_name AS connection_name").
		Joins("JOIN users ON users.id = user_connections.user_id").
		Joins("JOIN connections ON connections.id = user_connections.connection_id").
		Where("user_connections.user_id = ?", userID)

	err := query.Find(&userConnections).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while fetching user connections"})
		return
	}
	if len(userConnections) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No connections found for this user"})
		return
	}
	c.JSON(http.StatusOK, userConnections)
}

func UserRoutes(r *gin.Engine) {
	r.POST("/api/users", CreateUser)
	r.PUT("/api/users/:id", UpdateUser)
	r.DELETE("/api/users/:id", DeleteUser)
	r.POST("/api/users/:id/password", SetInitialPassword)
	r.PUT("/api/users/:id/password", UpdatePassword)
	r.GET("/api/users/:id", GetUser)
	r.GET("/api/users", GetAllUsers)
	r.GET("/api/users/:id/connections", GetConnectionsForUser)
}
