package main

import (
	"log"
	"os"
	"path/filepath"
	"services/shared/db"
	"services/shared/utils"

	"github.com/salobook/services/employee-service/internal/handler"
	"github.com/salobook/services/employee-service/internal/model"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

    utils.Info("Starting Employee Service...")

    // Check if auto-clean is enabled via environment variable
    autoClean := os.Getenv("EMPLOYEE_AUTO_CLEAN") == "true"
    
    // Initialize database with service-specific configuration
    db.InitPostgres(db.DBConfig{
        ServiceName: "EMPLOYEE",
        AutoCleanTables: autoClean,
    })

    // AutoMigrate all models
    err := db.DB.AutoMigrate(
		&model.Employee{},
		&model.EmployeeService{},
		&model.Schedule{},
		&model.RecurringBreak{},
		&model.OnetimeBlock{},
	)
    if err != nil {
        log.Fatalf("AutoMigrate failed: %v", err)
    }

    app := fiber.New()

    // Add CORS middleware to allow frontend requests
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
        AllowHeaders: "Origin,Content-Type,Accept,Authorization",
    }))

    // Setup all routes
    handler.SetupEmployeeRoutes(app)
    handler.SetupEmployeeServiceRoutes(app)
    handler.SetupScheduleRoutes(app)
    handler.SetupRecurringBreakRoutes(app)
    handler.SetupOnetimeBlockRoutes(app)
    handler.SetupAvailabilityRoutes(app)

    // Get service-specific port or use default
    port := os.Getenv("EMPLOYEE_SERVICE_PORT")
    if port == "" {
        port = os.Getenv("DEFAULT_PORT")
        if port == "" {
            port = "3002" // Fallback for employee service
        }
    }

    utils.Info("Employee service running on port " + port)
    if err := app.Listen(":" + port); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}