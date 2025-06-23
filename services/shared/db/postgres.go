package db

import (
	"fmt"
	"os"
	"services/shared/utils"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB is the global database connection
var DB *gorm.DB

// DBConfig holds database configuration
type DBConfig struct {
    ServiceName    string // e.g., "BOOKING", "USER", "NOTIFICATION"
    AutoCleanTables bool  // Whether to automatically clean tables on startup
    Tables         []string // Tables to clean (defaults to all service tables if empty)
}

// InitPostgres initializes a connection to PostgreSQL with service-specific configuration
func InitPostgres(config DBConfig) {
    // Get the service-specific environment variable
    envVarName := fmt.Sprintf("%s_DB_URL", config.ServiceName)
    dsn := os.Getenv(envVarName)
    
    // If service-specific variable doesn't exist, try the general one
    if dsn == "" {
        dsn = os.Getenv("DEFAULT_DB_URL")
    }
    
    // If still empty, panic
    if dsn == "" {
        utils.Error(fmt.Sprintf("Database URL not found for %s service", config.ServiceName))
        panic(fmt.Sprintf("Database URL not found for %s service", config.ServiceName))
    }

    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        utils.Error(fmt.Sprintf("Failed to connect to %s database: %v", config.ServiceName, err))
        panic(fmt.Sprintf("Failed to connect to %s database", config.ServiceName))
    }

    // Enable UUID extension
    if result := DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"); result.Error != nil {
        utils.Warning(fmt.Sprintf("Could not enable UUID extension: %v - UUID functionality may be limited", result.Error))
        // Continue anyway as the extension might already exist or be managed separately
    }

    // Auto-clean tables if enabled
    if config.AutoCleanTables {
    if len(config.Tables) == 0 {
        // Default tables based on service name
        switch strings.ToUpper(config.ServiceName) {
        case "BOOKING":
            config.Tables = []string{"bookings"} // Only specify the root table
        case "EMPLOYEE":
            config.Tables = []string{"employees"}
        case "Service":
            config.Tables = []string{"services"}
        default:
            utils.Warning(fmt.Sprintf("No default tables defined for service %s, skipping auto-clean", config.ServiceName))
        }
    }

    // Clean the specified tables
    for _, table := range config.Tables {
        if err := ResetTable(table); err != nil {
            utils.Warning(fmt.Sprintf("Failed to clean table %s: %v", table, err))
        } else {
            utils.Info(fmt.Sprintf("Cleaned table %s for %s service", table, config.ServiceName))
        }
    }
}

    utils.Info(fmt.Sprintf("Connected to %s PostgreSQL database", config.ServiceName))
}

// Close closes the database connection
func Close() {
    sqlDB, err := DB.DB()
    if err != nil {
        utils.Error("Error getting SQL DB: " + err.Error())
        return
    }
    sqlDB.Close()
}

// ResetTable drops a table and all its dependencies
func ResetTable(tableName string) error {
    return DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", tableName)).Error
}

// EnableExtension enables a PostgreSQL extension
func EnableExtension(extension string) error {
    return DB.Exec(fmt.Sprintf("CREATE EXTENSION IF NOT EXISTS \"%s\";", extension)).Error
}