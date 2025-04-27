package db

import (
	"fmt"
	"githubclone-backend/models"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	name := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", host, user, password, name, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Failed to connect to database:", err)
	}
}

func AutoMigrate() error {
	enumDefinitions := []struct {
		TypeName  string
		CreateSQL string
	}{
		{"user_type", `CREATE TYPE user_type AS ENUM ('admin', 'user')`},
		{"connection_type", `CREATE TYPE connection_type AS ENUM ('github', 'gitlab', 'ghes')`},
		{"permission_type", `CREATE TYPE permission_type AS ENUM ('CreateUser', 'DeleteUser', 'EditUser')`},
	}

	for _, enum := range enumDefinitions {
		// Delete the type if it already exists
		dropSQL := `DROP TYPE IF EXISTS ` + enum.TypeName + ` CASCADE`
		if err := DB.Exec(dropSQL).Error; err != nil {
			return err
		}

		// Create the type
		if err := DB.Exec(enum.CreateSQL).Error; err != nil {
			return err
		}
	}

	models := []interface{}{
		&models.User{},
		&models.Permission{},
		&models.Connection{},
		&models.UserConnection{},
		// Add further models here
	}

	for _, m := range models {
		if err := DB.AutoMigrate(m); err != nil {
			return err
		}
	}
	return nil
}
