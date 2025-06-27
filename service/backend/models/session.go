package models

import (
	"time"
)

type Session struct {
	ID        string `gorm:"primaryKey"`
	UserID    uint   `gorm:"not null;index"`
	User      User   `gorm:"constraint:OnDelete:CASCADE;"`
	ExpiresAt time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type OAuth2Session struct {
	ID           uint       `gorm:"primaryKey"`
	SessionID    string     `gorm:"not null;index"`
	Session      Session    `gorm:"constraint:OnDelete:CASCADE;"`
	ConnectionID uint       `gorm:"not null;index"`
	Connection   Connection `gorm:"constraint:OnDelete:CASCADE;"`
	AccessToken  string
	RefreshToken string
	ExpiresAt    *time.Time
	LastSeenAt   time.Time `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
