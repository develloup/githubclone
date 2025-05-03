package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username       string       `gorm:"unique;not null"`
	Email          string       `gorm:"default:''"`
	PasswordHash   string       `gorm:"not null;default:''"`
	CreatedAt      time.Time    `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time    `gorm:"not null;default:CURRENT_TIMESTAMP"`
	PasswordExpiry time.Time    `gorm:"not null;default:CURRENT_TIMESTAMP"`
	Description    string       `gorm:"default:''"`
	Deactivated    bool         `gorm:"not null;default:false"`
	Deletable      bool         `gorm:"not null;default:true"`
	PasswordSet    bool         `gorm:"not null;default:true"`      // Boolean value to force to set a new password
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
	ConnectionName string    `gorm:"unique;not null"`
	Type           string    `gorm:"type:connection_type;not null"`
	URL            *string   // Optional, therefore defined as a pointer, mandatory only for GHES
	ClientID       string    `gorm:"not null"`
	ClientSecret   string    `gorm:"not null"`
	CreatedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	Description    string    `gorm:"default:''"`
	Deactivated    bool      `gorm:"not null"`
}

type UserConnection struct {
	UserID       uint      `gorm:"primaryKey;constraint:OnDelete:CASCADE"`
	ConnectionID uint      `gorm:"primaryKey;constraint:OnDelete:CASCADE"`
	CreatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}
