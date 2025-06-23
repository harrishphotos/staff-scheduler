package handler

import (
	"services/booking-service/internal/booking"
	"services/shared/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func GetBookingsRangeHandler(c *fiber.Ctx) error {
	salonIDStr := c.Query("salon_id")
	startStr := c.Query("start") // ISO 8601
	endStr := c.Query("end")     // ISO 8601

	if salonIDStr == "" || startStr == "" || endStr == "" {
		return c.Status(400).JSON(fiber.Map{"error": "salon_id, start, and end query params are required"})
	}

	salonID, err := uuid.Parse(salonIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid salon_id"})
	}

	startDate, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid start date format"})
	}

	endDate, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid end date format"})
	}

	bookings, err := booking.GetSalonBookingsBetween(salonID, startDate, endDate)
	if err != nil {
		utils.Error("Failed to fetch bookings: " + err.Error())
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch bookings"})
	}

	return c.JSON(bookings)
}
