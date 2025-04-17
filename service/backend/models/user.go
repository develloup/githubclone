package models

import "gorm.io/gorm"

type User struct {
	ID    uint   `gorm:"primaryKey"`
	Name  string `gorm:"size:100"`
	Email string `gorm:"unique"`
}

func AutoMigrate(db *gorm.DB) {
	db.AutoMigrate(&User{})
}
