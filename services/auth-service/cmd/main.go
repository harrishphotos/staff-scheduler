package main

import (
	"log"
	"os"
	"path/filepath"
	"services/shared/db"
	"services/shared/utils"

	"github.com/salobook/services/auth-service/internal/handler"
	"github.com/salobook/services/auth-service/internal/model"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	envPaths := []string{
		filepath.Join("..", "..", "..", ".env"),
		filepath.Join("..", "..", ".env"),
		filepath.Join(".env"),
	}

	envLoaded := false
	for _, path := range envPaths {
		absPath, _ := filepath.Abs(path)
		if _, err := os.Stat(absPath); err == nil {
			err = godotenv.Load(absPath)
			if err == nil {
				log.Printf("Loaded .env from: %s", absPath)
				envLoaded = true
				break
			}
		}
	}

	if !envLoaded {
		log.Println("Warning: .env file not found. Using environment variables.")
	}

	utils.Info("Starting Auth Service...")

	// Check if auto-clean is enabled via environment variable
	autoClean := os.Getenv("USER_AUTO_CLEAN") == "true"

	// Initialize database with service-specific configuration (using USER database)
	db.InitPostgres(db.DBConfig{
		ServiceName:     "USER",
		AutoCleanTables: autoClean,
	})

	// AutoMigrate user model
	err := db.DB.AutoMigrate(&model.User{})
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	app := fiber.New()

	// CORS is handled by API Gateway - no need to set it here
	// Removed CORS middleware to prevent duplicate headers

	// Setup routes
	handler.SetupRoutes(app)

	// Get service-specific port or use default
	port := os.Getenv("AUTH_SERVICE_PORT")
	if port == "" {
		port = os.Getenv("DEFAULT_PORT")
		if port == "" {
			port = "3004" // Default port for auth service
		}
	}

	utils.Info("Auth service running on port " + port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 