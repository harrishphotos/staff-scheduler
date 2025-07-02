package main

import (
	"log"
	"os"
	"services/api-gateway/internal/handler"
	"services/api-gateway/internal/health"
	"services/shared/utils"
	"strings"

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
	
	// Enhanced CORS configuration with better error handling
	allowedOrigins := setupCORS()
	
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Setup routes
	handler.SetupRoutes(app)

	// Initialize and start health monitoring for production services
	healthMonitor := health.SetupHealthMonitor()
	
	// Add health monitoring endpoint
	app.Get("/monitor/health", func(c *fiber.Ctx) error {
		servicesHealth := healthMonitor.GetAllServicesHealth()
		return c.JSON(fiber.Map{
			"gateway": "UP",
			"services": servicesHealth,
		})
	})

	// Add CORS debug endpoint
	app.Get("/debug/cors", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"allowedOrigins": allowedOrigins,
			"requestOrigin":  c.Get("Origin"),
			"userAgent":      c.Get("User-Agent"),
			"method":         c.Method(),
		})
	})

	// Get service-specific port or use default
	port := os.Getenv("PORT") // Render's standard PORT variable
	if port == "" {
		port = os.Getenv("GATEWAY_PORT")
		if port == "" {
			port = "8081" // Default port for API Gateway
		}
	}

	utils.Info("API Gateway running on port " + port)
	utils.Info("CORS configured for origins: " + allowedOrigins)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start API Gateway: %v", err)
	}
}

// setupCORS configures CORS origins with validation and cleanup
func setupCORS() string {
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	
	// Default origins for development
	defaultOrigins := "http://localhost:5173,http://localhost:3000,http://localhost:4173"
	
	if allowedOrigins == "" {
		log.Println("[CORS] No ALLOWED_ORIGINS found, using defaults")
		return defaultOrigins
	}
	
	// Clean and validate origins
	origins := strings.Split(allowedOrigins, ",")
	var cleanOrigins []string
	
	for _, origin := range origins {
		origin = strings.TrimSpace(origin)
		
		// Remove any invalid prefixes (like @)
		if strings.HasPrefix(origin, "@") {
			origin = strings.TrimPrefix(origin, "@")
			log.Printf("[CORS] Removed invalid '@' prefix from origin: %s", origin)
		}
		
		// Validate origin format
		if origin != "" && (strings.HasPrefix(origin, "http://") || strings.HasPrefix(origin, "https://")) {
			cleanOrigins = append(cleanOrigins, origin)
			log.Printf("[CORS] Added valid origin: %s", origin)
		} else if origin != "" {
			log.Printf("[CORS] WARNING: Invalid origin format ignored: %s", origin)
		}
	}
	
	// If no valid origins found, use defaults
	if len(cleanOrigins) == 0 {
		log.Println("[CORS] No valid origins found, falling back to defaults")
		return defaultOrigins
	}
	
	result := strings.Join(cleanOrigins, ",")
	log.Printf("[CORS] Final configured origins: %s", result)
	return result
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