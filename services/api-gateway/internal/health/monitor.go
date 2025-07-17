package health

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// HealthMonitor manages service health and keep-alive functionality
type HealthMonitor struct {
	services     map[string]*ServiceHealth
	mutex        sync.RWMutex
	stopChannel  chan bool
	isRunning    bool
	pingInterval time.Duration
}

// ServiceHealth tracks individual service health metrics
type ServiceHealth struct {
	Name             string
	URL              string
	LastPing         time.Time
	LastHealthy      time.Time
	FailureCount     int
	IsHealthy        bool
	ResponseTime     time.Duration
	ConsecutiveFails int
	IsActive         bool // Whether to actively monitor this service
}

// NewHealthMonitor creates a new health monitor instance
func NewHealthMonitor() *HealthMonitor {
	return &HealthMonitor{
		services:     make(map[string]*ServiceHealth),
		stopChannel:  make(chan bool),
		isRunning:    false,
		pingInterval: 5 * time.Minute, // Ping every 5 minutes to keep services warm
	}
}

// RegisterService adds a service to be monitored
func (hm *HealthMonitor) RegisterService(name, serviceURL string, isActive bool) {
	hm.mutex.Lock()
	defer hm.mutex.Unlock()
	
	hm.services[name] = &ServiceHealth{
		Name:             name,
		URL:              serviceURL,
		LastPing:         time.Time{},
		LastHealthy:      time.Time{},
		FailureCount:     0,
		IsHealthy:        false,
		ConsecutiveFails: 0,
		IsActive:         isActive,
	}
	
	fmt.Printf("[MONITOR] Registered service %s at %s (active: %v)\n", name, serviceURL, isActive)
}

// Start begins the health monitoring process
func (hm *HealthMonitor) Start() {
	hm.mutex.Lock()
	if hm.isRunning {
		hm.mutex.Unlock()
		return
	}
	hm.isRunning = true
	hm.mutex.Unlock()
	
	fmt.Printf("[MONITOR] Starting health monitor with %d minute intervals\n", int(hm.pingInterval.Minutes()))
	
	// Perform initial health checks
	go hm.performHealthChecks()
	
	// Start the monitoring loop
	go hm.monitoringLoop()
}

// Stop stops the health monitoring process
func (hm *HealthMonitor) Stop() {
	hm.mutex.Lock()
	defer hm.mutex.Unlock()
	
	if !hm.isRunning {
		return
	}
	
	hm.isRunning = false
	hm.stopChannel <- true
	fmt.Printf("[MONITOR] Health monitor stopped\n")
}

// GetServiceHealth returns the current health status of a service
func (hm *HealthMonitor) GetServiceHealth(serviceName string) (*ServiceHealth, bool) {
	hm.mutex.RLock()
	defer hm.mutex.RUnlock()
	
	service, exists := hm.services[serviceName]
	if !exists {
		return nil, false
	}
	
	// Return a copy to avoid race conditions
	return &ServiceHealth{
		Name:             service.Name,
		URL:              service.URL,
		LastPing:         service.LastPing,
		LastHealthy:      service.LastHealthy,
		FailureCount:     service.FailureCount,
		IsHealthy:        service.IsHealthy,
		ResponseTime:     service.ResponseTime,
		ConsecutiveFails: service.ConsecutiveFails,
		IsActive:         service.IsActive,
	}, true
}

// GetAllServicesHealth returns health status of all monitored services
func (hm *HealthMonitor) GetAllServicesHealth() map[string]*ServiceHealth {
	hm.mutex.RLock()
	defer hm.mutex.RUnlock()
	
	result := make(map[string]*ServiceHealth)
	for name, service := range hm.services {
		result[name] = &ServiceHealth{
			Name:             service.Name,
			URL:              service.URL,
			LastPing:         service.LastPing,
			LastHealthy:      service.LastHealthy,
			FailureCount:     service.FailureCount,
			IsHealthy:        service.IsHealthy,
			ResponseTime:     service.ResponseTime,
			ConsecutiveFails: service.ConsecutiveFails,
			IsActive:         service.IsActive,
		}
	}
	return result
}

// monitoringLoop runs the main monitoring loop
func (hm *HealthMonitor) monitoringLoop() {
	ticker := time.NewTicker(hm.pingInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			go hm.performHealthChecks()
		case <-hm.stopChannel:
			return
		}
	}
}

// performHealthChecks checks health of all active services
func (hm *HealthMonitor) performHealthChecks() {
	hm.mutex.RLock()
	services := make([]*ServiceHealth, 0, len(hm.services))
	for _, service := range hm.services {
		if service.IsActive {
			services = append(services, service)
		}
	}
	hm.mutex.RUnlock()
	
	if len(services) == 0 {
		return
	}
	
	fmt.Printf("[MONITOR] Performing health checks for %d services\n", len(services))
	
	// Perform health checks concurrently
	var wg sync.WaitGroup
	for _, service := range services {
		wg.Add(1)
		go func(svc *ServiceHealth) {
			defer wg.Done()
			hm.checkServiceHealth(svc)
		}(service)
	}
	wg.Wait()
	
	hm.logHealthStatus()
}

// checkServiceHealth performs a health check on a single service
func (hm *HealthMonitor) checkServiceHealth(service *ServiceHealth) {
	startTime := time.Now()
	healthURL := service.URL + "/health"
	
	client := &http.Client{
		Timeout: 10 * time.Second, // Standard health check timeout
	}
	
	resp, err := client.Get(healthURL)
	responseTime := time.Since(startTime)
	
	hm.mutex.Lock()
	defer hm.mutex.Unlock()
	
	service.LastPing = time.Now()
	service.ResponseTime = responseTime
	
	if err != nil || resp.StatusCode != 200 {
		service.IsHealthy = false
		service.FailureCount++
		service.ConsecutiveFails++
		
		fmt.Printf("[MONITOR] ❌ %s health check failed (consecutive: %d): %v\n", 
			service.Name, service.ConsecutiveFails, err)
		
		// If service has been failing for too long, try to wake it up aggressively
		if service.ConsecutiveFails >= 2 {
			go hm.attemptServiceWakeUp(service)
		}
	} else {
		resp.Body.Close()
		service.IsHealthy = true
		service.LastHealthy = time.Now()
		service.ConsecutiveFails = 0
		
		if responseTime > 10*time.Second {
			fmt.Printf("[MONITOR] ⚠️  %s responded slowly: %v (might have been sleeping)\n", 
				service.Name, responseTime)
		} else {
			fmt.Printf("[MONITOR] ✅ %s healthy: %v\n", service.Name, responseTime)
		}
	}
}

// attemptServiceWakeUp tries to wake up a failing service
func (hm *HealthMonitor) attemptServiceWakeUp(service *ServiceHealth) {
	fmt.Printf("[MONITOR] 🔄 Attempting to wake up %s...\n", service.Name)
	
	// Make multiple quick requests to trigger wake-up
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	
	for i := 0; i < 3; i++ {
		resp, err := client.Get(service.URL + "/health")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			fmt.Printf("[MONITOR] ✅ Successfully woke up %s\n", service.Name)
			return
		}
		if resp != nil {
			resp.Body.Close()
		}
		time.Sleep(2 * time.Second)
	}
	
	fmt.Printf("[MONITOR] ❌ Failed to wake up %s\n", service.Name)
}

// logHealthStatus logs a summary of all service health
func (hm *HealthMonitor) logHealthStatus() {
	hm.mutex.RLock()
	defer hm.mutex.RUnlock()
	
	healthy := 0
	total := 0
	for _, service := range hm.services {
		if service.IsActive {
			total++
			if service.IsHealthy {
				healthy++
			}
		}
	}
	
	fmt.Printf("[MONITOR] Health summary: %d/%d services healthy\n", healthy, total)
}

// SetupHealthMonitor initializes and starts the health monitor with service discovery
func SetupHealthMonitor() *HealthMonitor {
	monitor := NewHealthMonitor()
	
	// Register services from environment variables
	authURL := os.Getenv("AUTH_SERVICE_URL")
	if authURL == "" {
		authURL = "http://localhost:3004"
	}
	
	employeeURL := os.Getenv("EMPLOYEE_SERVICE_URL")
	if employeeURL == "" {
		employeeURL = "http://localhost:3002"
	}
	
	// Only monitor production DigitalOcean services (they have .ondigitalocean.app in URL)
	isProduction := strings.Contains(authURL, ".ondigitalocean.app") || strings.Contains(employeeURL, ".ondigitalocean.app")
	
	monitor.RegisterService("auth", authURL, isProduction)
	monitor.RegisterService("employee", employeeURL, isProduction)
	
	if isProduction {
		fmt.Printf("[MONITOR] Production environment detected - enabling active monitoring\n")
		monitor.Start()
	} else {
		fmt.Printf("[MONITOR] Development environment detected - monitoring disabled\n")
	}
	
	return monitor
} 