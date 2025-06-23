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

func SetupScheduleRoutes(app *fiber.App) {
	// Create a new schedule 
	// check model for the field details
	app.Post("/schedules", func(c *fiber.Ctx) error {
		// 1. Parse and validate basic input
		var input validator.ScheduleInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
		}

		// 2. Validate required fields
		if err := validator.ValidateRequiredFields(input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 3. Validate employee ID and existence
		employeeID, err := validator.ValidateEmployeeExists(input.EmployeeID)
		if err != nil {
			if err.Error() == "employee not found" {
				return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
			}
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 4. Validate and normalize time formats - now returns time.Time objects
		startTime, endTime, err := validator.ValidateAndNormalizeTimes(input.StartTime, input.EndTime)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 5. Parse and validate dates
		validFrom, validUntil, isRecurring, err := validator.ValidateAndParseDates(input.ValidFrom, input.ValidUntil)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 6. Handle day_of_week based on recurrence
		dayOfWeek := service.CalculateDayOfWeek(input.DayOfWeek, validFrom, isRecurring)
		if err := validator.ValidateDayOfWeek(dayOfWeek, isRecurring); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 7. Create schedule object - now using time.Time for start and end times
		schedule := service.BuildScheduleModel(employeeID, dayOfWeek, startTime, endTime, validFrom, validUntil, input.Notes)

		// 8. Check for duplicate schedules
		if err := service.CheckForDuplicateSchedule(schedule, nil); err != nil {
			if _, ok := err.(*service.DuplicateScheduleError); ok {
				return c.Status(409).JSON(fiber.Map{"error": err.Error()})
			}
			return c.Status(500).JSON(fiber.Map{"error": "internal server error"})
		}

		// 9. Save to database
		if err := repository.CreateSchedule(schedule); err != nil {
			utils.Error("Failed to create schedule: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to create schedule"})
		}

		return c.Status(201).JSON(schedule)
	})
	
	// Get schedules with optional filtering
	app.Get("/schedules", func(c *fiber.Ctx) error {
		var schedules []model.Schedule
		var err error
		
		// Get query parameters for filtering
		employeeIDStr := c.Query("employee_id")
		dayOfWeekStr := c.Query("dayofweek")
		validUntilFlag := c.Query("validuntil")
		
		// Parse employee ID if provided
		var employeeID *uuid.UUID
		if employeeIDStr != "" {
			parsedID, err := uuid.Parse(employeeIDStr)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "invalid employee ID format"})
			}
			employeeID = &parsedID
		}
		
		// Parse day of week if provided
		var dayOfWeek *int
		if dayOfWeekStr != "" {
			var parsedDay int
			_, err := fmt.Sscanf(dayOfWeekStr, "%d", &parsedDay)
			if err != nil || parsedDay < 0 || parsedDay > 6 {
				return c.Status(400).JSON(fiber.Map{"error": "day of week must be between 0 (Sunday) and 6 (Saturday)"})
			}
			dayOfWeek = &parsedDay
		}
		
		// Get schedules based on filters
		schedules, err = repository.GetFilteredSchedules(employeeID, dayOfWeek, validUntilFlag == "all")
		if err != nil {
			utils.Error("Failed to get schedules: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to get schedules"})
		}
		
		return c.JSON(schedules)
	})

	// Update existing schedule
	app.Put("/schedules/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate schedule ID
		scheduleID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid schedule ID format"})
		}

		// 2. Check if schedule exists
		existingSchedule, err := repository.GetScheduleByID(scheduleID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "schedule not found"})
		}

		// 3. Parse and validate update input
		var input validator.ScheduleInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
		}

		// 4. Validate required fields
		if err := validator.ValidateRequiredFields(input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 5. Validate employee ID and existence
		employeeID, err := validator.ValidateEmployeeExists(input.EmployeeID)
		if err != nil {
			if err.Error() == "employee not found" {
				return c.Status(404).JSON(fiber.Map{"error": "employee not found"})
			}
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 6. Validate and normalize time formats
		startTime, endTime, err := validator.ValidateAndNormalizeTimes(input.StartTime, input.EndTime)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 7. Parse and validate dates
		validFrom, validUntil, isRecurring, err := validator.ValidateAndParseDates(input.ValidFrom, input.ValidUntil)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 8. Handle day_of_week based on recurrence
		dayOfWeek := service.CalculateDayOfWeek(input.DayOfWeek, validFrom, isRecurring)
		if err := validator.ValidateDayOfWeek(dayOfWeek, isRecurring); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}

		// 9. Update schedule object
		existingSchedule.EmployeeID = employeeID
		existingSchedule.DayOfWeek = dayOfWeek
		existingSchedule.StartTime = startTime
		existingSchedule.EndTime = endTime
		existingSchedule.ValidFrom = validFrom
		existingSchedule.ValidUntil = validUntil
		existingSchedule.Notes = input.Notes

		// 10. Check for duplicate schedules (excluding current one)
		if err := service.CheckForDuplicateSchedule(&existingSchedule, &scheduleID); err != nil {
			if _, ok := err.(*service.DuplicateScheduleError); ok {
				return c.Status(409).JSON(fiber.Map{"error": err.Error()})
			}
			return c.Status(500).JSON(fiber.Map{"error": "internal server error"})
		}

		// 11. Save to database
		if err := repository.UpdateSchedule(&existingSchedule); err != nil {
			utils.Error("Failed to update schedule: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to update schedule"})
		}

		return c.JSON(existingSchedule)
	})

	// Delete schedule
	app.Delete("/schedules/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate schedule ID
		scheduleID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid schedule ID format"})
		}

		// 2. Check if schedule exists
		_, err = repository.GetScheduleByID(scheduleID)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "schedule not found"})
		}

		// 3. Delete schedule
		if err := repository.DeleteSchedule(scheduleID); err != nil {
			utils.Error("Failed to delete schedule: " + err.Error())
			return c.Status(500).JSON(fiber.Map{"error": "failed to delete schedule"})
		}

		return c.Status(204).Send(nil)
	})
} 