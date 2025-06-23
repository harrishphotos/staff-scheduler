package handler

import (
	"services/shared/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
	"github.com/salobook/services/employee-service/internal/service"
	"github.com/salobook/services/employee-service/internal/validator"
)

// SetupOnetimeBlockRoutes configures the routes for one-time block management.
func SetupOnetimeBlockRoutes(app *fiber.App) {
	// Create a new one-time block
	app.Post("/onetime-blocks", func(c *fiber.Ctx) error {
		// 1. Parse input
		var input validator.OnetimeBlockInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input for one-time block"})
		}

		// 2. Validate required fields
		if err := validator.ValidateOnetimeBlockRequiredFields(input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 3. Validate employee ID and existence
		employeeID, err := validator.ValidateEmployeeExists(input.EmployeeID)
		if err != nil {
			if err.Error() == "employee not found" {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "employee not found"})
			}
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 4. Validate and parse date-times
		startDateTime, endDateTime, err := validator.ValidateAndParseOnetimeBlockDateTimes(input.StartDateTime, input.EndDateTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 5. Build one-time block model
		onetimeBlock := service.BuildOnetimeBlockModel(employeeID, startDateTime, endDateTime, input.Reason)

		// 6. Check for overlapping one-time blocks
		if err := service.CheckForOverlappingOnetimeBlock(onetimeBlock, nil); err != nil {
			if _, ok := err.(*service.OverlappingOnetimeBlockError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for overlapping one-time block: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for overlapping one-time block"})
		}

		// 7. Save to database
		if err := repository.CreateOnetimeBlock(onetimeBlock); err != nil {
			utils.Error("Failed to create one-time block: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create one-time block"})
		}

		return c.Status(fiber.StatusCreated).JSON(onetimeBlock)
	})

	// Get one-time blocks with optional filtering
	app.Get("/onetime-blocks", func(c *fiber.Ctx) error {
		var onetimeBlocks []model.OnetimeBlock
		var err error

		// Get query parameters for filtering
		employeeIDStr := c.Query("employee_id")
		startDateStr := c.Query("start_date")
		endDateStr := c.Query("end_date")

		// Parse employee ID if provided
		var employeeID *uuid.UUID
		if employeeIDStr != "" {
			parsedID, err := uuid.Parse(employeeIDStr)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid employee ID format"})
			}
			employeeID = &parsedID
		}

		// Parse start date if provided
		var startDate *time.Time
		if startDateStr != "" {
			parsedDate, err := time.Parse("2006-01-02", startDateStr)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid start_date format, use YYYY-MM-DD"})
			}
			startDate = &parsedDate
		}

		// Parse end date if provided
		var endDate *time.Time
		if endDateStr != "" {
			parsedDate, err := time.Parse("2006-01-02", endDateStr)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid end_date format, use YYYY-MM-DD"})
			}
			// Set the time to the end of the day for inclusive end date filtering
			parsedDate = time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 23, 59, 59, 999999999, parsedDate.Location())
			endDate = &parsedDate
		}

		// Get one-time blocks based on filters
		onetimeBlocks, err = repository.GetFilteredOnetimeBlocks(employeeID, startDate, endDate)
		if err != nil {
			utils.Error("Failed to get one-time blocks: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get one-time blocks"})
		}

		return c.JSON(onetimeBlocks)
	})

	// Update existing one-time block
	app.Put("/onetime-blocks/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate one-time block ID
		blockID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid one-time block ID format"})
		}

		// 2. Check if one-time block exists
		existingBlock, err := repository.GetOnetimeBlockByID(blockID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "one-time block not found"})
		}

		// 3. Parse and validate update input
		var input validator.OnetimeBlockInput
		if err := c.BodyParser(&input); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input for one-time block"})
		}

		// 4. Validate required fields
		if err := validator.ValidateOnetimeBlockRequiredFields(input); err != nil {
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

		// 6. Validate and parse date-times
		startDateTime, endDateTime, err := validator.ValidateAndParseOnetimeBlockDateTimes(input.StartDateTime, input.EndDateTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}

		// 7. Update one-time block object
		existingBlock.EmployeeID = employeeID
		existingBlock.StartDateTime = startDateTime
		existingBlock.EndDateTime = endDateTime
		existingBlock.Reason = input.Reason

		// 8. Check for overlapping one-time blocks (excluding current one)
		if err := service.CheckForOverlappingOnetimeBlock(&existingBlock, &blockID); err != nil {
			if _, ok := err.(*service.OverlappingOnetimeBlockError); ok {
				return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
			}
			utils.Error("Error checking for overlapping one-time block: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "error checking for overlapping one-time block"})
		}

		// 9. Save to database
		if err := repository.UpdateOnetimeBlock(&existingBlock); err != nil {
			utils.Error("Failed to update one-time block: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update one-time block"})
		}

		return c.JSON(existingBlock)
	})

	// Delete one-time block
	app.Delete("/onetime-blocks/:id", func(c *fiber.Ctx) error {
		// 1. Parse and validate one-time block ID
		blockID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid one-time block ID format"})
		}

		// 2. Check if one-time block exists
		_, err = repository.GetOnetimeBlockByID(blockID)
		if err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "one-time block not found"})
		}

		// 3. Delete one-time block
		if err := repository.DeleteOnetimeBlock(blockID); err != nil {
			utils.Error("Failed to delete one-time block: " + err.Error())
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete one-time block"})
		}

		return c.Status(204).Send(nil)
	})
} 