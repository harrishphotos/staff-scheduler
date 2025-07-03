package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"services/api-gateway/internal/handler"
	"services/api-gateway/internal/health"
	"services/api-gateway/internal/proxy"
	"services/shared/utils"
	"strings"
	"time"

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
	
	// Add explicit preflight handler BEFORE CORS middleware
	app.Options("/*", func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		
		// Validate origin is in allowed list
		allowedList := strings.Split(allowedOrigins, ",")
		isAllowed := false
		for _, allowed := range allowedList {
			if strings.TrimSpace(allowed) == origin {
				isAllowed = true
				break
			}
		}
		
		if isAllowed {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			c.Set("Access-Control-Allow-Headers", c.Get("Access-Control-Request-Headers"))
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Max-Age", "86400")
		}
		
		log.Printf("[CORS] Preflight request from origin: %s, allowed: %v", origin, isAllowed)
		return c.SendStatus(204)
	})
	
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "*", // Allow all headers for debugging
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length,Content-Type,Authorization",
		MaxAge:           86400, // 24 hours
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
			"headers":        c.GetReqHeaders(),
			"envVars": fiber.Map{
				"ALLOWED_ORIGINS": os.Getenv("ALLOWED_ORIGINS"),
				"ENVIRONMENT":     os.Getenv("ENVIRONMENT"),
			},
		})
	})

	// Add specific CORS test endpoint
	app.All("/debug/cors-test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "CORS test successful",
			"method":  c.Method(),
			"origin":  c.Get("Origin"),
			"headers": c.GetReqHeaders(),
		})
	})

	// Add service URL debug endpoint
	app.Get("/debug/services", func(c *fiber.Ctx) error {
		authURL := proxy.GetServiceURL("auth")
		employeeURL := proxy.GetServiceURL("employee")
		
		// Test connectivity
		authStatus := "unknown"
		employeeStatus := "unknown"
		
		// Quick health check with short timeout
		client := &http.Client{Timeout: 10 * time.Second}
		
		if authResp, err := client.Get(authURL + "/health"); err != nil {
			authStatus = fmt.Sprintf("error: %v", err)
		} else {
			authResp.Body.Close()
			authStatus = fmt.Sprintf("status %d", authResp.StatusCode)
		}
		
		if empResp, err := client.Get(employeeURL + "/health"); err != nil {
			employeeStatus = fmt.Sprintf("error: %v", err)
		} else {
			empResp.Body.Close()
			employeeStatus = fmt.Sprintf("status %d", empResp.StatusCode)
		}
		
		return c.JSON(fiber.Map{
			"environment_variables": fiber.Map{
				"AUTH_SERVICE_URL":     os.Getenv("AUTH_SERVICE_URL"),
				"EMPLOYEE_SERVICE_URL": os.Getenv("EMPLOYEE_SERVICE_URL"),
				"PORT":                 os.Getenv("PORT"),
				"GATEWAY_PORT":         os.Getenv("GATEWAY_PORT"),
				"ENVIRONMENT":          os.Getenv("ENVIRONMENT"),
			},
			"resolved_urls": fiber.Map{
				"auth_service":     authURL,
				"employee_service": employeeURL,
			},
			"connectivity_test": fiber.Map{
				"auth_service":     authStatus,
				"employee_service": employeeStatus,
			},
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