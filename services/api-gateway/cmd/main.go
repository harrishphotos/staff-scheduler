package main

import (
	"log"
	"os"
	"services/api-gateway/internal/handler"
	"services/shared/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	loadEnv()

	// Create a new Fiber app
	app := fiber.New(fiber.Config{
		ProxyHeader: fiber.HeaderXForwardedFor,
	})

	// Add middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Setup routes
	handler.SetupRoutes(app)

	// Get service-specific port or use default
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8081" // Default port for API Gateway
	}

	utils.Info("API Gateway running on port " + port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start API Gateway: %v", err)
	}
}

func loadEnv() {
	// Try to load environment variables from different locations
	envPaths := []string{
		".env",
		"../.env",
		"../../.env",
	}

	envLoaded := false
	for _, path := range envPaths {
		if _, err := os.Stat(path); err == nil {
			err = godotenv.Load(path)
			if err == nil {
				log.Printf("Loaded .env from: %s", path)
				envLoaded = true
				break
			}
		}
	}

	if !envLoaded {
		log.Println("Warning: .env file not found. Using environment variables.")
	}
} 