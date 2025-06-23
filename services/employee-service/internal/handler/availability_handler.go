package handler

import (
	"services/shared/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/service"
	"github.com/salobook/services/employee-service/internal/validator"
)

// AvailableEmployeeResponse represents the response structure for available employees
type AvailableEmployeeResponse struct {
	EmployeeID string   `json:"employeeid"`
	Service    []string `json:"service"`
	EWT        []string `json:"EWT"`
}

// SetupAvailabilityRoutes configures the routes for employee availability checking
func SetupAvailabilityRoutes(app *fiber.App) {
	// Check employee availability for given services and time range
	app.Post("/employees/availability", func(c *fiber.Ctx) error {
		// 1. Parse and validate input
		var input validator.AvailabilityInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input format"})
		}

		// 2. Validate required fields and format
		serviceIDs, startTime, endTime, date, err := validator.ValidateAvailabilityInput(input)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 3. Get available employees with their effective working time
		availableEmployees, err := service.GetAvailableEmployeesForServices(serviceIDs, startTime, endTime, date)
		if err != nil {
			utils.Error("Failed to get available employees: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to check employee availability"})
		}

		// 4. Build response format
		response := make([]AvailableEmployeeResponse, len(availableEmployees))
		for i, emp := range availableEmployees {
			response[i] = AvailableEmployeeResponse{
				EmployeeID: emp.EmployeeID.String(),
				Service:    convertUUIDsToStrings(emp.ServiceIDs),
				EWT:        emp.AvailableSlots,
			}
		}

		return c.JSON(response)
	})

	// Check employees currently in salon (in spot)
	app.Post("/employees/status", func(c *fiber.Ctx) error {
		// 1. Parse input
		var input struct {
			CurrentTime string `json:"current_time"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input format"})
		}

		// 2. Validate and parse current time
		if input.CurrentTime == "" {
			return c.Status(400).JSON(fiber.Map{"error": "current_time is required"})
		}

		currentTime, err := time.Parse(time.RFC3339, input.CurrentTime)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid current_time format, use RFC3339"})
		}

		// 3. Get employees who are in spot at current time
		inSpotEmployees, err := service.GetEmployeesInSpotAtTime(currentTime)
		if err != nil {
			utils.Error("Failed to get in-spot employees: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to get employee status"})
		}

		// 4. Build response
		employeeIDs := make([]string, len(inSpotEmployees))
		for i, empID := range inSpotEmployees {
			employeeIDs[i] = empID.String()
		}

		return c.JSON(fiber.Map{
			"in_spot_employees": employeeIDs,
		})
	})
}

// convertUUIDsToStrings converts slice of UUIDs to slice of strings
func convertUUIDsToStrings(uuids []uuid.UUID) []string {
	result := make([]string, len(uuids))
	for i, id := range uuids {
		result[i] = id.String()
	}
	return result
} 