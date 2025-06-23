package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"services/booking-service/internal/handler"
	"services/booking-service/internal/model"
	"services/shared/db"
	"services/shared/utils"

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

	utils.Info("Starting Booking Service...")

	// Check if auto-clean is enabled via environment variable
	autoClean := os.Getenv("BOOKING_AUTO_CLEAN") == "true"

	// Initialize database
	db.InitPostgres(db.DBConfig{
		ServiceName:     "BOOKING",
		AutoCleanTables: autoClean,
	})

	err := db.DB.AutoMigrate(&model.Booking{}, &model.BookingSlot{})
	if err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		if origin != "" && strings.HasPrefix(origin, "http://localhost") {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			c.Set("Access-Control-Allow-Credentials", "true")

			if c.Method() == fiber.MethodOptions {
				return c.SendStatus(fiber.StatusNoContent)
			}
		}
		return c.Next()
	})

	// Register routes
	handler.SetupRoutes(app)

	// Get port from env
	port := os.Getenv("BOOKING_SERVICE_PORT")
	if port == "" {
		port = os.Getenv("DEFAULT_PORT")
		if port == "" {
			port = "3001" // fallback
		}
	}

	utils.Info("Booking service running on port " + port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
