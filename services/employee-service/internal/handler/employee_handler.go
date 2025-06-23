package handler

import (
	"services/shared/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// SetupEmployeeRoutes configures the routes for employee management
func SetupEmployeeRoutes(app *fiber.App) {
	// Create a new employee
	app.Post("/employees", func(c *fiber.Ctx) error {
		var input struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Picture   string `json:"picture"`
			Role      string `json:"role"`
			IsActive  bool   `json:"is_active"`
		}

		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
		}

		// Validate required fields
		if input.FirstName == "" || input.LastName == "" || input.Email == "" {
			return c.Status(400).JSON(fiber.Map{"error": "first_name, last_name, and email are required"})
		}

		// Check if employee with email already exists
		_, err := repository.GetEmployeeByEmail(input.Email)
		if err == nil {
			return c.Status(409).JSON(fiber.Map{"error": "employee with this email already exists"})
		}

		// Create employee object - use the IsActive directly
		employee := &model.Employee{
			FirstName: input.FirstName,
			LastName:  input.LastName,
			Email:     input.Email,
			Picture:   input.Picture,
			Role:      input.Role,
			IsActive:  input.IsActive, 
		}

		// Save to database
		if err := repository.CreateEmployee(employee); err != nil {
			utils.Error("Failed to create employee: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to create employee"})
		}

		return c.Status(201).JSON(employee)
	})

	// Get all employees
	app.Get("/employees", func(c *fiber.Ctx) error {
		employees, err := repository.GetAllEmployees()
		if err != nil {
			utils.Error("Failed to fetch employees: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to fetch employees"})
		}
		return c.JSON(employees)
	})

	// Get employee by ID
	app.Get("/employees/:id", func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee ID"})
		}

		employee, err := repository.GetEmployeeByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
		}

		return c.JSON(employee)
	})

	// Update employee
	app.Put("/employees/:id", func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee ID"})
		}

		// Get existing employee
		employee, err := repository.GetEmployeeByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
		}

		// Parse input
		var input struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
			Picture   string `json:"picture"`
			Role      string `json:"role"`
			IsActive  *bool  `json:"is_active"` // Using pointer for partial updates
		}

		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
		}

		// Update fields if provided
		if input.FirstName != "" {
			employee.FirstName = input.FirstName
		}
		if input.LastName != "" {
			employee.LastName = input.LastName
		}
		if input.Email != "" && input.Email != employee.Email {
			// Check if email is already in use by another employee
			existingEmployee, err := repository.GetEmployeeByEmail(input.Email)
			if err == nil && existingEmployee.ID != employee.ID {
				return c.Status(409).JSON(fiber.Map{"error": "email already in use by another employee"})
			}
			employee.Email = input.Email
		}
		
		// Update picture and role (allow empty strings to clear these fields)
		employee.Picture = input.Picture
		employee.Role = input.Role
		
		// Only update IsActive if it was included in the request
		if input.IsActive != nil {
			employee.IsActive = *input.IsActive
		}

		// Save changes
		if err := repository.UpdateEmployee(&employee); err != nil {
			utils.Error("Failed to update employee: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to update employee"})
		}

		return c.JSON(employee)
	})

	// Delete employee
	app.Delete("/employees/:id", func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid employee ID"})
		}

		// Check if employee exists
		_, err = repository.GetEmployeeByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
		}

		// Delete employee
		if err := repository.DeleteEmployee(id); err != nil {
			utils.Error("Failed to delete employee: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to delete employee"})
		}

		return c.Status(204).Send(nil)
	})
} 