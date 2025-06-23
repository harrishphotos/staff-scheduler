package handler

import (
	"fmt"
	"services/booking-service/internal/client"
	"services/booking-service/internal/repository"
	"services/shared/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// StatusResponse represents the response structure for employee status
type StatusResponse struct {
	Serving []string `json:"serving"`
	Idle    []string `json:"idle"`
	Out     []string `json:"out"`
}

func StatusHandler(c *fiber.Ctx) error {
	// Get current time in UTC
	currentTime := time.Now().UTC()

	// Log the current time
	fmt.Printf("Getting employee status for current time: %v\n", currentTime)

	// 1. Get all serving employees at current time
	servingEmployees, err := getServingEmployeesAtTime(currentTime)
	if err != nil {
		utils.Error("Failed to get serving employees: " + err.Error())
		return c.Status(500).JSON(fiber.Map{"error": "failed to get serving employees"})
	}

	// 2. Get all employees currently in spot from employee service
	inSpotEmployees, err := getInSpotEmployeesFromService(currentTime)
	if err != nil {
		utils.Error("Failed to get in-spot employees: " + err.Error())
		return c.Status(500).JSON(fiber.Map{"error": "failed to get in-spot employees"})
	}

	// 3. Calculate idle employees (in spot - serving)
	idleEmployees := calculateIdleEmployees(inSpotEmployees, servingEmployees)

	// 4. For "out" employees, we can either get all employees and subtract in-spot,
	//    or just return empty array since it's not explicitly requested in the current logic
	outEmployees := []string{} // TODO: Implement if needed

	// 5. Build response
	response := StatusResponse{
		Serving: servingEmployees,
		Idle:    idleEmployees,
		Out:     outEmployees,
	}

	// Log the response
	fmt.Printf("Status response: Serving: %d, Idle: %d, Out: %d\n", 
		len(response.Serving), len(response.Idle), len(response.Out))

	return c.JSON(response)
}

// getServingEmployeesAtTime gets all employees who are currently serving customers
func getServingEmployeesAtTime(currentTime time.Time) ([]string, error) {
	// 1. Get bookings with status "serving" that overlap current time
	servingBookings, err := repository.GetServingBookingsAtTime(currentTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get serving bookings: %v", err)
	}

	// 2. Extract booking IDs
	bookingIDs := make([]uuid.UUID, len(servingBookings))
	for i, booking := range servingBookings {
		bookingIDs[i] = booking.ID
	}

	// 3. Get booking slots that overlap with current time
	bookingSlots, err := repository.GetBookingSlotsOverlappingTime(bookingIDs, currentTime)
	if err != nil {
		return nil, fmt.Errorf("failed to get booking slots: %v", err)
	}

	// 4. Extract unique staff IDs
	staffIDMap := make(map[string]bool)
	for _, slot := range bookingSlots {
		staffIDMap[slot.StaffID.String()] = true
	}

	// 5. Convert to slice
	var servingEmployees []string
	for staffID := range staffIDMap {
		servingEmployees = append(servingEmployees, staffID)
	}

	fmt.Printf("Found %d serving employees: %v\n", len(servingEmployees), servingEmployees)
	return servingEmployees, nil
}

// getInSpotEmployeesFromService calls employee service to get employees currently in salon
func getInSpotEmployeesFromService(currentTime time.Time) ([]string, error) {
	// Create employee client
	employeeClient := client.NewEmployeeClient()

	// Prepare request
	req := client.EmployeeStatusRequest{
		CurrentTime: currentTime.Format(time.RFC3339),
	}

	// Call employee service
	response, err := employeeClient.GetEmployeesInSpot(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call employee service: %v", err)
	}

	fmt.Printf("Found %d in-spot employees: %v\n", len(response.InSpotEmployees), response.InSpotEmployees)
	return response.InSpotEmployees, nil
}

// calculateIdleEmployees calculates idle employees (in spot but not serving)
func calculateIdleEmployees(inSpotEmployees, servingEmployees []string) []string {
	// Create map for quick lookup of serving employees
	servingMap := make(map[string]bool)
	for _, empID := range servingEmployees {
		servingMap[empID] = true
	}

	// Find employees who are in spot but not serving
	var idleEmployees []string
	for _, empID := range inSpotEmployees {
		if !servingMap[empID] {
			idleEmployees = append(idleEmployees, empID)
		}
	}

	fmt.Printf("Calculated %d idle employees: %v\n", len(idleEmployees), idleEmployees)
	return idleEmployees
} 