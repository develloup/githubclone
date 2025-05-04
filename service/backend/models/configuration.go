package models

import "gorm.io/gorm"

var AllowedKeys = map[string]string{
	"password_expiry_days":   "90",
	"no_password_expiration": "False",
	"max_login_attempts":     "5",
	"session_timeout":        "30",
}

type Configuration struct {
	gorm.Model
	Key   string `gorm:"unique; not null"`
	Value string `gorm:"default:''"`
}
