package models

import "gorm.io/gorm"

var AllowedKeys = map[string]string{
	"password_expiry_daxs": "90",
	"max_login_attempts":   "5",
	"session_timeout":      "30",
}

type Configuration struct {
	gorm.Model
	Key   string `gorm:"unique; not null"`
	Value string `gorm:"default:''"`
}
