package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// EmployeeAvailabilityRequest represents the request structure for employee availability
type EmployeeAvailabilityRequest struct {
	Service   []string `json:"service"`
	StartTime string   `json:"starttime"`
	EndTime   string   `json:"endtime"`
}

// EmployeeAvailabilityResponse represents the response from employee service
type EmployeeAvailabilityResponse struct {
	EmployeeID string   `json:"employeeid"`
	Service    []string `json:"service"`
	EWT        []string `json:"EWT"`
}

// EmployeeStatusRequest represents the request structure for employee status
type EmployeeStatusRequest struct {
	CurrentTime string `json:"current_time"`
}

// EmployeeStatusResponse represents the response from employee status endpoint
type EmployeeStatusResponse struct {
	InSpotEmployees []string `json:"in_spot_employees"`
}

// EmployeeClient handles communication with the employee service
type EmployeeClient struct {
	baseURL string
	client  *http.Client
}

// NewEmployeeClient creates a new employee service client
func NewEmployeeClient() *EmployeeClient {
	baseURL := os.Getenv("EMPLOYEE_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3002" // Default employee service URL
	}

	return &EmployeeClient{
		baseURL: baseURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetEmployeeAvailability calls the employee service to get availability
func (ec *EmployeeClient) GetEmployeeAvailability(req EmployeeAvailabilityRequest) ([]EmployeeAvailabilityResponse, error) {
	// Convert request to JSON
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/employees/availability", ec.baseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")

	// Make the request
	resp, err := ec.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to employee service: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Handle non-200 status codes
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("employee service returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var availability []EmployeeAvailabilityResponse
	if err := json.Unmarshal(body, &availability); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %v", err)
	}

	return availability, nil
}

// GetEmployeesInSpot calls the employee service to get employees currently in salon
func (ec *EmployeeClient) GetEmployeesInSpot(req EmployeeStatusRequest) (*EmployeeStatusResponse, error) {
	// Convert request to JSON
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/employees/status", ec.baseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")

	// Make the request
	resp, err := ec.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to employee service: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Handle non-200 status codes
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("employee service returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var status EmployeeStatusResponse
	if err := json.Unmarshal(body, &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %v", err)
	}

	return &status, nil
} 