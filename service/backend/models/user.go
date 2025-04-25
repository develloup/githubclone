package models

import "gorm.io/gorm"

type User struct {
	ID          uint         `gorm:"primaryKey"`
	Username    string       `gorm:"not null"`
	Email       string       `gorm:"unique;not null"`
	Connections []Connection `gorm:"many2many:user_connections;"`
}

type Connection struct {
	ID             uint   `gorm:"primaryKey"`
	URL            string // Mandatory for GHES instance, not necessary for github, gitlab
	ClientID       string `gorm:"not null"`
	ClientSecret   string `gorm:"not null"`
	SessionStarted bool
	AccessToken    string
	Users          []User `gorm:"many2many:user_connections;"`
}

func AutoMigrate(db *gorm.DB) {
	db.AutoMigrate(&User{})
}
