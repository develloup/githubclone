package models

import (
	"time"

	"gorm.io/gorm"
)

type UserInput struct {
	Username       string       `json:"username" binding:"required"`
	Email          string       `json:"email" binding:"required,email"`
	PasswordExpiry time.Time    `json:"passwordExpiry"`
	Description    string       `json:"description"`
	Deactivated    bool         `json:"deactivated"`
	PasswordSet    bool         `json:"passwordSet"`
	UserType       string       `json:"type" binding:"required"`
	Permissions    []Permission `json:"permissions"`
}

type User struct {
	gorm.Model
	Username       string    `gorm:"not null"`
	Email          string    `gorm:"unique;not null"`
	PasswordHash   string    `gorm:"not null"`
	AccountCreated time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	AccountUpdated time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	PasswordExpiry time.Time `gorm:"not null"`
	Description    string
	Deactivated    bool
	PasswordSet    bool         `gorm:"not null"`                   // Boolean value to force to set a new password
	UserType       string       `gorm:"type:user_type;not null"`    // Enum for a user type
	Permissions    []Permission `gorm:"many2many:user_permissions"` // Many-to-many relation to permissions
	Connections    []Connection `gorm:"many2many:user_connections"` // Many-to-many relation to connections
}

type Permission struct {
	gorm.Model
	Name string `gorm:"type:permission_type;not null"` // Enum for permissions
}

type UserPermission struct {
	UserID       uint      `gorm:"primaryKey"`
	PermissionID uint      `gorm:"primaryKey"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}

type Connection struct {
	gorm.Model
	Type           string  `gorm:"type:connection_type;not null"`
	URL            *string // Optional, therefore defined as a pointer, mandatory only for GHES
	ClientID       string  `gorm:"not null"`
	ClientSecret   string  `gorm:"not null"`
	SessionStarted time.Time
	AccessToken    string
}

type UserConnection struct {
	UserID       uint      `gorm:"primaryKey"`
	ConnectionID uint      `gorm:"primaryKey"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}
