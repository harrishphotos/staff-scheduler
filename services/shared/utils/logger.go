package utils

import (
	"fmt"
	"log"
	"os"
	"time"
)

var (
    infoLogger    *log.Logger
    warningLogger *log.Logger
    errorLogger   *log.Logger
)

func init() {
    infoLogger = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime)
    warningLogger = log.New(os.Stdout, "WARNING: ", log.Ldate|log.Ltime)
    errorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime)
}

// Info logs an informational message
func Info(message string) {
    infoLogger.Println(message)
}

// Warning logs a warning message
func Warning(message string) {
    warningLogger.Println(message)
}

// Error logs an error message
func Error(message string) {
    errorLogger.Println(message)
}

// LogRequest logs an HTTP request
func LogRequest(method, path, ip string, status int, duration time.Duration) {
    infoLogger.Printf(
        "Method: %s | Path: %s | IP: %s | Status: %d | Duration: %v",
        method, path, ip, status, duration,
    )
}

// LogServerStart logs when the server starts
func LogServerStart(port string) {
    infoLogger.Printf("Server started on port %s", port)
}

// LogDBConnection logs database connection status
func LogDBConnection(success bool, details string) {
    if success {
        infoLogger.Printf("Database connected: %s", details)
    } else {
        errorLogger.Printf("Database connection failed: %s", details)
    }
}

// FormatError returns a formatted error string
func FormatError(err error) string {
    if err == nil {
        return ""
    }
    return fmt.Sprintf("Error: %v", err)
}