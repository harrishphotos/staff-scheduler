package proxy

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// ServiceState tracks the current state of each service
type ServiceState struct {
	URL           string
	IsHealthy     bool
	IsWakingUp    bool
	LastHealthCheck time.Time
	WakeUpStarted   time.Time
	RequestQueue    []QueuedRequest
	QueueMutex      sync.RWMutex
	WakeUpMutex     sync.Mutex
}

// QueuedRequest represents a request waiting for service to wake up
type QueuedRequest struct {
	Context     *fiber.Ctx
	TargetURL   string
	StartTime   time.Time
	ResponseChan chan *ProxyResponse
}

// ProxyResponse encapsulates the response from a proxied request
type ProxyResponse struct {
	StatusCode int
	Body       []byte
	Headers    map[string][]string
	Error      error
}

// Global service registry
var (
	serviceRegistry = make(map[string]*ServiceState)
	registryMutex   sync.RWMutex
)

// GetServiceURL returns the URL for a given service based on environment variables (exported for debugging)
func GetServiceURL(serviceName string) string {
	envVarName := fmt.Sprintf("%s_SERVICE_URL", strings.ToUpper(serviceName))
	serviceURL := os.Getenv(envVarName)
	
	fmt.Printf("[DEBUG] Looking for env var: %s\n", envVarName)
	fmt.Printf("[DEBUG] Raw env value: '%s'\n", serviceURL)
	
	if serviceURL == "" {
		// Fallback to default URLs if not configured
		fmt.Printf("[DEBUG] No env var found for %s, using fallback\n", serviceName)
		switch serviceName {
		case "employee":
			return "http://localhost:3002"
		case "auth":
			return "http://localhost:3004"
		default:
			return "http://localhost:3000"
		}
	}
	
	// Ensure URL has proper protocol scheme
	if !strings.HasPrefix(serviceURL, "http://") && !strings.HasPrefix(serviceURL, "https://") {
		serviceURL = "https://" + serviceURL
		fmt.Printf("[DEBUG] Added https:// prefix, final URL: %s\n", serviceURL)
	}
	
	return serviceURL
}

// getOrCreateServiceState gets or creates service state for tracking
func getOrCreateServiceState(serviceURL string) *ServiceState {
	registryMutex.Lock()
	defer registryMutex.Unlock()
	
	if state, exists := serviceRegistry[serviceURL]; exists {
		return state
	}
	
	serviceRegistry[serviceURL] = &ServiceState{
		URL:             serviceURL,
		IsHealthy:       false,
		IsWakingUp:      false,
		LastHealthCheck: time.Time{},
		RequestQueue:    make([]QueuedRequest, 0),
	}
	
	return serviceRegistry[serviceURL]
}

// ForwardToEmployeeService forwards requests to the employee service
func ForwardToEmployeeService(c *fiber.Ctx) error {
	targetURL := GetServiceURL("employee")
	return forwardRequestWithQueue(c, targetURL)
}

// ForwardToAuthService forwards requests to the auth service
func ForwardToAuthService(c *fiber.Ctx) error {
	targetURL := GetServiceURL("auth")
	fmt.Printf("[DEBUG] Auth service URL resolved to: %s\n", targetURL)
	return forwardRequestWithQueue(c, targetURL)
}

// checkServiceHealth checks if a service is ready by calling its health endpoint
func checkServiceHealth(serviceURL string) bool {
	healthURL := serviceURL + "/health"
	
	client := &http.Client{
		Timeout: 15 * time.Second, // Reasonable timeout for health checks (increased from 10s)
	}
	
	resp, err := client.Get(healthURL)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	
	return resp.StatusCode == 200
}

// updateServiceHealth updates the health status and timestamp
func updateServiceHealth(serviceState *ServiceState) {
	isHealthy := checkServiceHealth(serviceState.URL)
	serviceState.IsHealthy = isHealthy
	serviceState.LastHealthCheck = time.Now()
	
	if isHealthy && serviceState.IsWakingUp {
		serviceState.IsWakingUp = false
		fmt.Printf("[HEALTH] Service %s is now healthy and ready\n", serviceState.URL)
		go processQueuedRequests(serviceState)
	}
}

// startServiceWakeUp performs a quick health check on the service (simplified for always-on services)
func startServiceWakeUp(serviceState *ServiceState) {
	serviceState.WakeUpMutex.Lock()
	defer serviceState.WakeUpMutex.Unlock()
	
	// If already checking, don't start another process
	if serviceState.IsWakingUp {
		return
	}
	
	serviceState.IsWakingUp = true
	
	fmt.Printf("[HEALTH] Checking service health for %s\n", serviceState.URL)
	
	// Quick health check
	go func() {
		client := &http.Client{Timeout: 10 * time.Second} // Standard timeout for always-on services
		healthEndpoint := serviceState.URL + "/health"
		
		resp, err := client.Get(healthEndpoint)
		if resp != nil {
			resp.Body.Close()
		}
		
		// Check if service is ready
		if err == nil && resp.StatusCode == 200 {
			serviceState.IsHealthy = true
			serviceState.IsWakingUp = false
			serviceState.LastHealthCheck = time.Now()
			fmt.Printf("[HEALTH] Service %s is healthy\n", serviceState.URL)
			go processQueuedRequests(serviceState)
		} else {
			serviceState.IsWakingUp = false
			fmt.Printf("[HEALTH] Service %s health check failed: %v\n", serviceState.URL, err)
			go processQueuedRequestsWithError(serviceState, 
				fmt.Errorf("service health check failed: %v", err))
		}
	}()
}

// processQueuedRequests processes all queued requests when service becomes healthy
func processQueuedRequests(serviceState *ServiceState) {
	serviceState.QueueMutex.Lock()
	requests := make([]QueuedRequest, len(serviceState.RequestQueue))
	copy(requests, serviceState.RequestQueue)
	serviceState.RequestQueue = serviceState.RequestQueue[:0] // Clear queue
	serviceState.QueueMutex.Unlock()
	
	fmt.Printf("[QUEUE] Processing %d queued requests for service %s\n", 
		len(requests), serviceState.URL)
	
	for _, req := range requests {
		go func(queuedReq QueuedRequest) {
			response := makeDirectRequest(queuedReq.Context, queuedReq.TargetURL)
			queuedReq.ResponseChan <- response
		}(req)
	}
}

// processQueuedRequestsWithError sends error response to all queued requests
func processQueuedRequestsWithError(serviceState *ServiceState, err error) {
	serviceState.QueueMutex.Lock()
	requests := make([]QueuedRequest, len(serviceState.RequestQueue))
	copy(requests, serviceState.RequestQueue)
	serviceState.RequestQueue = serviceState.RequestQueue[:0] // Clear queue
	serviceState.QueueMutex.Unlock()
	
	for _, req := range requests {
		go func(queuedReq QueuedRequest) {
			queuedReq.ResponseChan <- &ProxyResponse{
				StatusCode: fiber.StatusGatewayTimeout,
				Error:      err,
			}
		}(req)
	}
}

// forwardRequestWithQueue handles request with intelligent queuing and wake-up
func forwardRequestWithQueue(c *fiber.Ctx, targetBaseURL string) error {
	// Build the target URL
	path := c.Path()
	
	// Handle path transformation based on service type
	if strings.Contains(targetBaseURL, ":3004") || strings.Contains(targetBaseURL, "auth") {
		// Auth service: Keep the full path since it expects /api/auth/* routes
	} else {
		// Other services: Strip /api prefix and forward the resource path
		if strings.HasPrefix(path, "/api/") {
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
	
	serviceState := getOrCreateServiceState(targetBaseURL)
	
	// Check if we need to update health status (cache for 30 seconds)
	if time.Since(serviceState.LastHealthCheck) > 30*time.Second {
		go updateServiceHealth(serviceState)
	}
	
	// If service is healthy, forward immediately
	if serviceState.IsHealthy {
		return forwardRequestImmediately(c, targetURL)
	}
	
	// If service is not healthy, check health if not already checking
	if !serviceState.IsWakingUp {
		startServiceWakeUp(serviceState)
	}
	
	// Queue the request and wait for response
	responseChan := make(chan *ProxyResponse, 1)
	queuedRequest := QueuedRequest{
		Context:      c,
		TargetURL:    targetURL,
		StartTime:    time.Now(),
		ResponseChan: responseChan,
	}
	
	serviceState.QueueMutex.Lock()
	serviceState.RequestQueue = append(serviceState.RequestQueue, queuedRequest)
	queueLength := len(serviceState.RequestQueue)
	serviceState.QueueMutex.Unlock()
	
	fmt.Printf("[QUEUE] Queued request for %s (queue length: %d)\n", targetURL, queueLength)
	
	// Wait for response with timeout
	select {
	case response := <-responseChan:
		if response.Error != nil {
			return c.Status(response.StatusCode).JSON(fiber.Map{
				"error": "Service unavailable",
				"details": response.Error.Error(),
			})
		}
		
		// Copy headers
		for key, values := range response.Headers {
			for _, value := range values {
				c.Response().Header.Add(key, value)
			}
		}
		
		duration := time.Since(queuedRequest.StartTime)
		fmt.Printf("[QUEUE] Request completed in %v for %s\n", duration, targetURL)
		
		return c.Status(response.StatusCode).Send(response.Body)
		
	case <-time.After(80 * time.Second): // Slightly more than frontend timeout
		return c.Status(fiber.StatusGatewayTimeout).JSON(fiber.Map{
			"error": "Request timeout",
			"details": "Service failed to respond within timeout period",
		})
	}
}

// forwardRequestImmediately forwards request directly when service is healthy
func forwardRequestImmediately(c *fiber.Ctx, targetURL string) error {
	response := makeDirectRequest(c, targetURL)
	
	if response.Error != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "Failed to proxy request to service",
			"details": response.Error.Error(),
		})
	}
	
	// Copy headers (excluding CORS headers since gateway handles them)
	corsHeaders := map[string]bool{
		"Access-Control-Allow-Origin":      true,
		"Access-Control-Allow-Methods":     true,
		"Access-Control-Allow-Headers":     true,
		"Access-Control-Allow-Credentials": true,
		"Access-Control-Expose-Headers":    true,
		"Access-Control-Max-Age":           true,
	}
	
	for key, values := range response.Headers {
		if corsHeaders[key] {
			continue
		}
		for _, value := range values {
			c.Response().Header.Add(key, value)
		}
	}
	
	return c.Status(response.StatusCode).Send(response.Body)
}

// makeDirectRequest makes the actual HTTP request to the target service
func makeDirectRequest(c *fiber.Ctx, targetURL string) *ProxyResponse {
	// Create HTTP request
	req, err := http.NewRequest(
		c.Method(),
		targetURL,
		strings.NewReader(string(c.Body())),
	)
	if err != nil {
		return &ProxyResponse{
			StatusCode: fiber.StatusInternalServerError,
			Error:      fmt.Errorf("failed to create proxy request: %v", err),
		}
	}
	
	// Copy headers from the original request
	for key, values := range c.GetReqHeaders() {
		if key != "Host" {
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}
	}
	
	// Set forwarded headers
	req.Header.Set("X-Forwarded-Host", string(c.Request().Host()))
	req.Header.Set("X-Forwarded-Proto", "https")
	
	// Make request with timeout
	client := &http.Client{
		Timeout: 45 * time.Second, // Reasonable timeout for healthy services
	}
	
	startTime := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		return &ProxyResponse{
			StatusCode: fiber.StatusBadGateway,
			Error:      fmt.Errorf("request failed: %v", err),
		}
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ProxyResponse{
			StatusCode: fiber.StatusInternalServerError,
			Error:      fmt.Errorf("failed to read response: %v", err),
		}
	}
	
	// Log successful request
	duration := time.Since(startTime)
	fmt.Printf("[PROXY] %s %s -> %d (%v)\n", 
		c.Method(), targetURL, resp.StatusCode, duration)
	
	return &ProxyResponse{
		StatusCode: resp.StatusCode,
		Body:       body,
		Headers:    resp.Header,
		Error:      nil,
	}
} 