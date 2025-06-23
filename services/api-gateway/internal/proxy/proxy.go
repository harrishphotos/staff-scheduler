package proxy

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// getServiceURL returns the URL for a given service based on environment variables
func getServiceURL(serviceName string) string {
	envVarName := fmt.Sprintf("%s_SERVICE_URL", strings.ToUpper(serviceName))
	serviceURL := os.Getenv(envVarName)
	
	if serviceURL == "" {
		// Fallback to default URLs if not configured
		switch serviceName {
		case "employee":
			return "http://localhost:3002"
		case "booking":
			return "http://localhost:3001"
		case "service-management":
			return "http://localhost:3003"
		case "auth":
			return "http://localhost:3005"
		default:
			return "http://localhost:3000"
		}
	}
	
	return serviceURL
}

// ForwardToEmployeeService forwards requests to the employee service
func ForwardToEmployeeService(c *fiber.Ctx) error {
	targetURL := getServiceURL("employee")
	return forwardRequest(c, targetURL)
}

// ForwardToBookingService forwards requests to the booking service
func ForwardToBookingService(c *fiber.Ctx) error {
	targetURL := getServiceURL("booking")
	return forwardRequest(c, targetURL)
}

// ForwardToServiceManagementService forwards requests to the service management service
func ForwardToServiceManagementService(c *fiber.Ctx) error {
	targetURL := getServiceURL("service-management")
	return forwardRequest(c, targetURL)
}

// ForwardToAuthService forwards requests to the auth service
func ForwardToAuthService(c *fiber.Ctx) error {
	targetURL := getServiceURL("auth")
	return forwardRequest(c, targetURL)
}

// forwardRequest handles the actual proxying of the request to the target service
func forwardRequest(c *fiber.Ctx, targetBaseURL string) error {
	// Start timing the request
	startTime := time.Now()
	
	// Build the target URL
	path := c.Path()
	
	// Handle path transformation based on service type
	if strings.Contains(targetBaseURL, ":3005") || strings.Contains(targetBaseURL, "auth") {
		// Auth service: Keep the full path since it expects /api/auth/* routes
		// Example: /api/auth/login -> /api/auth/login
	} else {
		// Other services: Strip /api prefix and forward the resource path
		// Example: /api/employees/123 -> /employees/123
		// Example: /api/schedules -> /schedules
		// Example: /api/onetime-blocks/456 -> /onetime-blocks/456
		if strings.HasPrefix(path, "/api/") {
			// Remove /api prefix but keep everything else
			path = strings.TrimPrefix(path, "/api")
			if path == "" {
				path = "/"
			}
		}
	}
	
	targetURL := targetBaseURL + path
	
	// Add query parameters if they exist
	if c.Request().URI().QueryString() != nil {
		targetURL += "?" + string(c.Request().URI().QueryString())
	}
	
	// Create a new HTTP request
	req, err := http.NewRequest(
		c.Method(),
		targetURL,
		strings.NewReader(string(c.Body())),
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create proxy request",
			"details": err.Error(),
		})
	}
	
	// Copy headers from the original request
	for key, values := range c.GetReqHeaders() {
		if key != "Host" { // Skip the Host header
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}
	}
	
	// Set the X-Forwarded headers
	req.Header.Set("X-Forwarded-Host", string(c.Request().Host()))
	req.Header.Set("X-Forwarded-Proto", "http") // or https if using TLS
	
	// Send the request to the target service
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "Failed to proxy request to service",
			"details": err.Error(),
		})
	}
	defer resp.Body.Close()
	
	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read response from service",
			"details": err.Error(),
		})
	}
	
	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			c.Response().Header.Add(key, value)
		}
	}
	
	// Log the request
	duration := time.Since(startTime)
	fmt.Printf("[PROXY] %s %s -> %s %d (%v)\n", 
		c.Method(), c.Path(), targetURL, resp.StatusCode, duration)
	
	// Set the status code and send the response body
	return c.Status(resp.StatusCode).Send(body)
} 