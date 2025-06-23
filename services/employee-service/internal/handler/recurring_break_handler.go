package handler

import (
	"fmt"
	"services/shared/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
	"github.com/salobook/services/employee-service/internal/service"
	"github.com/salobook/services/employee-service/internal/validator"
)

func SetupRecurringBreakRoutes(app *fiber.App) {
	// Create a new recurring break
	app.Post("/recurring-breaks", func(c *fiber.Ctx) error {
		// 1. Parse input
		var input validator.RecurringBreakInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input for recurring break"})
		}

		// 2. Validate required fields
		if err := validator.ValidateRecurringBreakRequiredFields(input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 3. Validate employee ID and existence (reusing from schedule_validator)
		employeeID, err := validator.ValidateEmployeeExists(input.EmployeeID)
		if err != nil {
			if err.Error() == "employee not found" { 
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "employee not found"})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 4. Validate and normalize time formats (reusing from recurring_break_validator -> schedule_validator)
		startTime, endTime, err := validator.ValidateAndParseRecurringBreakTimes(input.StartTime, input.EndTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 5. Validate DayOfWeek (reusing from recurring_break_validator -> schedule_validator)
		dayOfWeek := *input.DayOfWeek // Dereference the pointer to get the int value
		if err := validator.ValidateRecurringBreakDayOfWeek(dayOfWeek); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 6. Build recurring break model
		recurringBreak := service.BuildRecurringBreakModel(employeeID, dayOfWeek, startTime, endTime, input.Reason)

		// 7. Check for duplicate recurring breaks (same reason, day, employee)
		if err := service.CheckForDuplicateRecurringBreak(recurringBreak, nil); err != nil {
			if _, ok := err.(*service.DuplicateRecurringBreakError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for duplicate recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for duplicate recurring break"})
		}

		// 8. Check for overlapping recurring breaks (time overlap on same day, employee)
		if err := service.CheckForOverlappingRecurringBreak(recurringBreak, nil); err != nil {
			if _, ok := err.(*service.OverlappingRecurringBreakError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for overlapping recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for overlapping recurring break"})
		}

		// 9. Save to database
		if err := repository.CreateRecurringBreak(recurringBreak); err != nil {
			utils.Error("Failed to create recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create recurring break"})
		}

		return c.Status(fiber.StatusCreated).JSON(recurringBreak)
	})
	
	// Get recurring breaks with optional filtering
	app.Get("/recurring-breaks", func(c *fiber.Ctx) error {
		var recurringBreaks []model.RecurringBreak
		var err error
		
		// Get query parameters for filtering
		employeeIDStr := c.Query("employee_id")
		dayOfWeekStr := c.Query("dayofweek")
		
		// Parse employee ID if provided
		var employeeID *uuid.UUID
		if employeeIDStr != "" {
			parsedID, err := uuid.Parse(employeeIDStr)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid employee ID format"})
			}
			employeeID = &parsedID
		}
		
		// Parse day of week if provided
		var dayOfWeek *int
		if dayOfWeekStr != "" {
			var parsedDay int
			_, err := fmt.Sscanf(dayOfWeekStr, "%d", &parsedDay)
			if err != nil || parsedDay < 0 || parsedDay > 6 {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "day of week must be between 0 (Sunday) and 6 (Saturday)"})
			}
			dayOfWeek = &parsedDay
		}
		
		// Get recurring breaks based on filters
		recurringBreaks, err = repository.GetFilteredRecurringBreaks(employeeID, dayOfWeek)
		if err != nil {
			utils.Error("Failed to get recurring breaks: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get recurring breaks"})
		}
		
		return c.JSON(recurringBreaks)
	})

	// Update existing recurring break
	app.Put("/recurring-breaks/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate recurring break ID
		breakID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid recurring break ID format"})
		}

		// 2. Check if recurring break exists
		existingBreak, err := repository.GetRecurringBreakByID(breakID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "recurring break not found"})
		}

		// 3. Parse and validate update input
		var input validator.RecurringBreakInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input for recurring break"})
		}

		// 4. Validate required fields
		if err := validator.ValidateRecurringBreakRequiredFields(input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 5. Validate employee ID and existence
		employeeID, err := validator.ValidateEmployeeExists(input.EmployeeID)
		if err != nil {
			if err.Error() == "employee not found" {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "employee not found"})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 6. Validate and normalize time formats
		startTime, endTime, err := validator.ValidateAndParseRecurringBreakTimes(input.StartTime, input.EndTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 7. Validate DayOfWeek
		dayOfWeek := *input.DayOfWeek
		if err := validator.ValidateRecurringBreakDayOfWeek(dayOfWeek); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 8. Update recurring break object
		existingBreak.EmployeeID = employeeID
		existingBreak.DayOfWeek = dayOfWeek
		existingBreak.StartTime = startTime
		existingBreak.EndTime = endTime
		existingBreak.Reason = input.Reason

		// 9. Check for duplicate recurring breaks (excluding current one)
		if err := service.CheckForDuplicateRecurringBreak(&existingBreak, &breakID); err != nil {
			if _, ok := err.(*service.DuplicateRecurringBreakError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for duplicate recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for duplicate recurring break"})
		}

		// 10. Check for overlapping recurring breaks (excluding current one)
		if err := service.CheckForOverlappingRecurringBreak(&existingBreak, &breakID); err != nil {
			if _, ok := err.(*service.OverlappingRecurringBreakError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for overlapping recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for overlapping recurring break"})
		}

		// 11. Save to database
		if err := repository.UpdateRecurringBreak(&existingBreak); err != nil {
			utils.Error("Failed to update recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update recurring break"})
		}

		return c.JSON(existingBreak)
	})

	// Delete recurring break
	app.Delete("/recurring-breaks/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate recurring break ID
		breakID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid recurring break ID format"})
		}

		// 2. Check if recurring break exists
		_, err = repository.GetRecurringBreakByID(breakID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "recurring break not found"})
		}

		// 3. Delete recurring break
		if err := repository.DeleteRecurringBreak(breakID); err != nil {
			utils.Error("Failed to delete recurring break: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete recurring break"})
		}

		return c.Status(204).Send(nil)
	})
} 