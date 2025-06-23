package handler

import (
	"services/shared/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// SetupEmployeeServiceRoutes configures the routes for employee-service association management
func SetupEmployeeServiceRoutes(app *fiber.App) {
	// Create a new employee-service association
	app.Post("/employee-services", func(c *fiber.Ctx) error {
		var input struct {
			EmployeeID string `json:"employee_id"`
			ServiceID  string `json:"service_id"`
		}

		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
		}

		// Validate required fields
		if input.EmployeeID == "" || input.ServiceID == "" {
			return c.Status(400).JSON(fiber.Map{"error": "employee_id and service_id are required"})
		}

		// Parse and validate UUIDs
		employeeID, err := uuid.Parse(input.EmployeeID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee_id format"})
		}

		serviceID, err := uuid.Parse(input.ServiceID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid service_id format"})
		}

		// Check if employee exists
		_, err = repository.GetEmployeeByID(employeeID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
		}

		// Check if association already exists
		exists, err := repository.CheckDuplicateEmployeeService(employeeID, serviceID)
		if err != nil {
			utils.Error("Failed to check duplicate employee-service: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to check duplicate association"})
		}
		if exists {
			return c.Status(409).JSON(fiber.Map{"error": "employee-service association already exists"})
		}

		// Create employee-service association
		employeeService := &model.EmployeeService{
			EmployeeID: employeeID,
			ServiceID:  serviceID,
		}

		// Save to database
		if err := repository.CreateEmployeeService(employeeService); err != nil {
			utils.Error("Failed to create employee-service association: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to create employee-service association"})
		}

		return c.Status(201).JSON(employeeService)
	})

	// Get all employee-service associations with optional filtering
	app.Get("/employee-services", func(c *fiber.Ctx) error {
		// Get query parameters for filtering
		employeeIDStr := c.Query("employee_id")
		serviceIDStr := c.Query("service_id")

		// Parse employee ID if provided
		var employeeID *uuid.UUID
		if employeeIDStr != "" {
			parsedID, err := uuid.Parse(employeeIDStr)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "invalid employee_id format"})
			}
			employeeID = &parsedID
		}

		// Parse service ID if provided
		var serviceID *uuid.UUID
		if serviceIDStr != "" {
			parsedID, err := uuid.Parse(serviceIDStr)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "invalid service_id format"})
			}
			serviceID = &parsedID
		}

		// Get filtered employee-services
		employeeServices, err := repository.GetFilteredEmployeeServices(employeeID, serviceID)
		if err != nil {
			utils.Error("Failed to fetch employee-services: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to fetch employee-services"})
		}

		return c.JSON(employeeServices)
	})

	// Get employee-service association by ID
	app.Get("/employee-services/:id", func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee-service ID"})
		}

		employeeService, err := repository.GetEmployeeServiceByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee-service association not found"})
		}

		return c.JSON(employeeService)
	})

	// Delete employee-service association
	app.Delete("/employee-services/:id", func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee-service ID"})
		}

		// Check if association exists
		_, err = repository.GetEmployeeServiceByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee-service association not found"})
		}

		// Delete association
		if err := repository.DeleteEmployeeService(id); err != nil {
			utils.Error("Failed to delete employee-service association: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to delete employee-service association"})
		}

		return c.Status(204).Send(nil)
	})
} 