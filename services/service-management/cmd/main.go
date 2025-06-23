package main

import (
	"log"
	"os"
	"path/filepath"
	"services/shared/db"
	"services/shared/utils"

	"github.com/salobook/services/service-management/internal/handler"
	"github.com/salobook/services/service-management/internal/model"

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

	utils.Info("Starting Service Management...")

	autoClean := os.Getenv("SERVICE_AUTO_CLEAN") == "true"

	db.InitPostgres(db.DBConfig{
		ServiceName:     "SERVICE",
		AutoCleanTables: autoClean,
	})

	err := db.DB.AutoMigrate(&model.Service{}, &model.Category{}, &model.Package{})
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	app := fiber.New()

	handler.SetupRoutes(app)

	// Serve frontend static files
	frontendPath := filepath.Join("frontend")
	absFrontendPath, err := filepath.Abs(frontendPath)
	if err != nil {
		log.Fatalf("Failed to resolve frontend path: %v", err)
	}
	log.Println("Serving frontend files from:", absFrontendPath)

	app.Static("/", absFrontendPath)

	// Handle root route to serve index.html explicitly
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendFile(filepath.Join(absFrontendPath, "index.html"))
	})

	port := os.Getenv("SERVICE_SERVICE_PORT")
	if port == "" {
		port = os.Getenv("DEFAULT_PORT")
		if port == "" {
			port = "3002"
		}
	}

	utils.Info("Service management running on port " + port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
