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
		case "auth":
			return "http://localhost:3004"
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

// ForwardToAuthService forwards requests to the auth service
func ForwardToAuthService(c *fiber.Ctx) error {
	targetURL := getServiceURL("auth")
	return forwardRequest(c, targetURL)
}

// checkServiceHealth checks if a service is ready by calling its health endpoint
func checkServiceHealth(serviceURL string) bool {
	healthURL := serviceURL + "/health"
	
	client := &http.Client{
		Timeout: 5 * time.Second,
	}
	
	resp, err := client.Get(healthURL)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	
	return resp.StatusCode == 200
}

// waitForServiceReady waits for a service to become ready with exponential backoff
func waitForServiceReady(serviceURL string, maxWait time.Duration) error {
	startTime := time.Now()
	attempt := 0
	
	for time.Since(startTime) < maxWait {
		if checkServiceHealth(serviceURL) {
			fmt.Printf("[HEALTH] Service %s is ready after %v (attempt %d)\n", serviceURL, time.Since(startTime), attempt+1)
			return nil
		}
		
		attempt++
		// Exponential backoff: 1s, 2s, 4s, 8s, then 5s intervals
		var delay time.Duration
		if attempt <= 4 {
			delay = time.Duration(1<<uint(attempt-1)) * time.Second
		} else {
			delay = 5 * time.Second
		}
		
		fmt.Printf("[HEALTH] Service %s not ready, retrying in %v (attempt %d)\n", serviceURL, delay, attempt)
		time.Sleep(delay)
	}
	
	return fmt.Errorf("service %s failed to become ready within %v", serviceURL, maxWait)
}

// forwardRequest handles the actual proxying of the request to the target service with cold start handling
func forwardRequest(c *fiber.Ctx, targetBaseURL string) error {
	// Start timing the request
	startTime := time.Now()
	
	// Build the target URL
	path := c.Path()
	
	// Handle path transformation based on service type
	if strings.Contains(targetBaseURL, ":3004") || strings.Contains(targetBaseURL, "auth") {
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
	
	// First, check if service is ready. If not, wait for it to wake up
	if !checkServiceHealth(targetBaseURL) {
		fmt.Printf("[WARMUP] Service %s appears to be sleeping, waiting for wake-up...\n", targetBaseURL)
		
		// Try to wake up the service by making a health check request (this will trigger cold start)
		go func() {
			client := &http.Client{Timeout: 1 * time.Second}
			client.Get(targetBaseURL + "/health")
		}()
		
		// Wait up to 90 seconds for service to become ready (matches frontend expectations)
		if err := waitForServiceReady(targetBaseURL, 90*time.Second); err != nil {
			fmt.Printf("[ERROR] %v\n", err)
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
				"error": "Service is unavailable - cold start timeout",
				"details": fmt.Sprintf("Service %s failed to wake up within 90 seconds", targetBaseURL),
			})
		}
	}
	
	// Now make the actual request with retry logic
	maxRetries := 3
	var lastErr error
	var resp *http.Response
	
	for attempt := 0; attempt < maxRetries; attempt++ {
		// Create a new HTTP request for each attempt
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
		
		// Progressive timeout: 60s, 75s, 90s
		timeout := time.Duration(60+15*attempt) * time.Second
		client := &http.Client{
			Timeout: timeout,
		}
		
		fmt.Printf("[PROXY] %s %s -> %s (attempt %d/%d, timeout %v)\n", 
			c.Method(), c.Path(), targetURL, attempt+1, maxRetries, timeout)
		
		// Send the request to the target service
		resp, err = client.Do(req)
		lastErr = err
		
		if err == nil {
			// Success! Break out of retry loop
			break
		}
		
		// If this was the last attempt, don't retry
		if attempt == maxRetries-1 {
			break
		}
		
		// Check if it's a timeout or connection error that might resolve with retry
		if strings.Contains(err.Error(), "timeout") || 
		   strings.Contains(err.Error(), "connection refused") ||
		   strings.Contains(err.Error(), "no such host") {
			
			delay := time.Duration(2*(attempt+1)) * time.Second
			fmt.Printf("[RETRY] Request failed (%v), retrying in %v...\n", err, delay)
			time.Sleep(delay)
			continue
		}
		
		// For other errors, don't retry
		break
	}
	
	if lastErr != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "Failed to proxy request to service after retries",
			"details": lastErr.Error(),
		})
	}
	
	if resp == nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "No response received from service",
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
	
	// Copy response headers (excluding CORS headers since gateway handles them)
	corsHeaders := map[string]bool{
		"Access-Control-Allow-Origin":      true,
		"Access-Control-Allow-Methods":     true,
		"Access-Control-Allow-Headers":     true,
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Expose-Headers":    true,
		"Access-Control-Max-Age":           true,
	}
	
	for key, values := range resp.Header {
		// Skip CORS headers since they're handled by the gateway
		if corsHeaders[key] {
			continue
		}
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