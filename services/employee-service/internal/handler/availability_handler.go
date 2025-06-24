package handler

import (
	"services/shared/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/service"
	"github.com/salobook/services/employee-service/internal/validator"
)

// SetupAvailabilityRoutes sets up the availability-related routes
func SetupAvailabilityRoutes(app *fiber.App) {
	// POST /availability - Get employee availability for a specific date
	app.Post("/availability", getEmployeeAvailability)
}

// getEmployeeAvailability handles the POST /availability endpoint
// Returns the complete availability information for an employee on a specific date
// including schedule, one-time blocks, and recurring breaks with conflict resolution
func getEmployeeAvailability(c *fiber.Ctx) error {
	// Step 1: Parse and validate request body
	var req model.AvailabilityRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Error("Failed to parse availability request: " + err.Error())
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Step 2: Validate required fields
	if err := validator.ValidateAvailabilityRequest(req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Step 3: Validate and parse employee ID
	employeeID, err := validator.ValidateAvailabilityEmployeeID(req.EmployeeID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Step 4: Validate and parse date
	date, err := validator.ValidateAndParseAvailabilityDate(req.Date)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Step 5: Optional validations (you can enable/disable these based on business requirements)
	
	// Uncomment if you want to prevent queries for past dates
	// if err := validator.ValidateAvailabilityDateNotInPast(date); err != nil {
	// 	return c.Status(400).JSON(fiber.Map{
	// 		"error": err.Error(),
	// 	})
	// }

	// Validate date range (prevent queries too far in the future)
	if err := validator.ValidateAvailabilityDateRange(date); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Step 6: Create availability service and get employee availability
	availabilityService := service.NewAvailabilityService()
	availability, err := availabilityService.GetEmployeeAvailability(employeeID, date)
	if err != nil {
		// Handle specific error cases
		switch err.Error() {
		case "employee not found":
			return c.Status(404).JSON(fiber.Map{
				"error": "Employee not found",
			})
		case "no schedule found for employee on this date":
			return c.Status(404).JSON(fiber.Map{
				"error": "No schedule found for employee on this date",
			})
		case "internal server error":
			return c.Status(500).JSON(fiber.Map{
				"error": "Internal server error",
			})
		default:
			utils.Error("Unexpected error in availability handler: " + err.Error())
			return c.Status(500).JSON(fiber.Map{
				"error": "Internal server error",
			})
		}
	}

	// Step 7: Return the availability response
	utils.Info("Successfully retrieved availability for employee " + employeeID.String() + " on date " + date.Format("2006-01-02"))
	return c.Status(200).JSON(availability)
} 