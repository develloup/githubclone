package api

import (
	"githubclone-backend/db"
	"githubclone-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

// Routine zur Konvertierung von UserInput zu User
func convertToUser(input models.UserInput) models.User {
	tnow := time.Now()
	user := models.User{
		Username:       input.Username,
		Email:          input.Email,
		PasswordHash:   "",
		AccountCreated: tnow,                 // Set current time
		AccountUpdated: tnow,                 // identical for first update
		PasswordExpiry: input.PasswordExpiry, // Set in half a year
		Description:    input.Description,
		Deactivated:    input.Deactivated,
		PasswordSet:    input.PasswordSet,
		UserType:       input.UserType,
	}
	return user
}

func CreateUser(c *gin.Context) {
	var userInput models.UserInput
	if err := c.ShouldBindJSON(&userInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := convertToUser(userInput)

	var existing models.User
	if err := db.DB.Unscoped().Where("username = ?", userInput.Username).First(&existing).Error; err == nil {
		if existing.DeletedAt.Valid {
			if err := db.DB.Unscoped().Delete(&existing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing soft-deleted user"})
				return
			}
		} else {
			c.JSON(http.StatusConflict, gin.H{"error": "User with the same username already exists"})
			return
		}
	}

	if err := db.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Link permissions to created user
	for _, permissionName := range userInput.Permissions {
		// Hole die Permission aus der Tabelle Permission
		var permission models.Permission
		if err := db.DB.Where("name = ?", permissionName.Name).First(&permission).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission: " + permissionName.Name})
			return
		}

		// Erstelle einen neuen Eintrag in UserPermission
		userPermission := models.UserPermission{
			UserID:       user.ID,       // Benutzer-ID des gerade erstellten Benutzers
			PermissionID: permission.ID, // ID der zugehörigen Berechtigung
			CreatedAt:    time.Now(),    // Zeitstempel automatisch setzen
		}

		// Speichere UserPermission in die Datenbank
		if err := db.DB.Create(&userPermission).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign permission"})
			return
		}
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
	var user models.User

	if err := db.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		}
		return
	}

	if err := c.ShouldBindJSON(&userInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if userInput.Email != nil {
		user.Email = *userInput.Email
	}
	if userInput.Description != nil {
		user.Description = *userInput.Description
	}

	if err := db.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully", "user": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	// Starte eine Transaktion
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		// Überprüfen, ob der Benutzer existiert
		var user models.User
		if err := tx.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return err // Rückgabe bricht die Transaktion ab
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
			return err
		}

		// Berechtigungen des Benutzers löschen
		if err := tx.Where("user_id = ?", id).Delete(&models.UserPermission{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user permissions"})
			return err
		}

		// Benutzer löschen
		if err := tx.Delete(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return err
		}

		return nil
	})

	// Transaktionsergebnis prüfen
	if err != nil {
		return // Fehler wurde bereits gesendet, kein weiterer Code erforderlich
	}

	// Erfolgsantwort senden
	c.JSON(http.StatusOK, gin.H{"message": "User and permissions deleted successfully"})
}

func GetUser(c *gin.Context) {
	var user userType
	id := c.Param("id")

	if err := db.DB.Model(&models.User{}).
		Select("id, username, email, description").
		Where("id = ? AND deactivated = ?", id, false).
		First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		}
		return
	}
	c.JSON(http.StatusOK, user)
}

func GetAllUsers(c *gin.Context) {
	var users userType
	if err := db.DB.Model(&models.User{}).
		Select("id, username, email, description").
		// Where("deactivated = ?", false).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func UserRoutes(r *gin.Engine) {
	r.POST("/users", CreateUser)
	r.PUT("/users/:id", UpdateUser)
	r.DELETE("/users/:id", DeleteUser)
	r.GET("/users/:id", GetUser)
	r.GET("/users", GetAllUsers)
}

// r.GET("/users", func(c *gin.Context) {
// 	var users []models.User
// 	db.DB.Find(&users)
// 	c.JSON(200, users)
// })
