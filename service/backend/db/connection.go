package db

import (
	"fmt"
	"githubclone-backend/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

var defaultPermissions = []models.Permission{
	{Model: gorm.Model{ID: 1}, Name: "CreateUser"},
	{Model: gorm.Model{ID: 2}, Name: "DeleteUser"},
	{Model: gorm.Model{ID: 3}, Name: "EditUser"},
}

var enumDefinitions = []struct {
	TypeName  string
	CreateSQL string
}{
	{"user_type", `CREATE TYPE user_type AS ENUM ('admin', 'user')`},
	{"connection_type", `CREATE TYPE connection_type AS ENUM ('github', 'gitlab', 'ghes')`},
	{"permission_type", `CREATE TYPE permission_type AS ENUM ('CreateUser', 'DeleteUser', 'EditUser')`},
}

func InitDB() error {
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
	return err
}

func initializePermissions() error {
	// Create new permissions
	for _, permission := range defaultPermissions {
		// Prüfe, ob die Permission bereits existiert, bevor du sie einfügst
		if err := DB.FirstOrCreate(&models.Permission{}, models.Permission{Name: permission.Name}).Error; err != nil {
			return err
		}
	}
	return nil
}

func initializeEnums() error {
	for _, enumDef := range enumDefinitions {
		var exists bool
		err := DB.Raw(`
            SELECT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = ?
            )
        `, enumDef.TypeName).Scan(&exists).Error
		if err != nil {
			return err
		}

		if !exists {
			if err := DB.Exec(enumDef.CreateSQL).Error; err != nil {
				return err
			}
			log.Printf("Created enum type: %s\n", enumDef.TypeName)
		} else {
			log.Printf("Enum type %s already exists\n", enumDef.TypeName)
		}
	}
	return nil
}

func AutoMigrate() error {
	if err := initializeEnums(); err != nil {
		return err
	}

	models := []interface{}{
		&models.User{},
		&models.Permission{},
		&models.Connection{},
		&models.UserConnection{},
		&models.UserPermission{},
		&models.Configuration{},
		// Add further models here
	}
	for _, m := range models {
		if err := DB.AutoMigrate(m); err != nil {
			return err
		}
	}
	err := initializePermissions()
	return err
}
