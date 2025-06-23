package handler

import (
	"fmt"
	"services/booking-service/internal/model"
	"services/booking-service/internal/repository"
	"services/shared/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// CreateBookingHandler handles the creation of a new booking.
// It validates the input, processes booking slots, and stores the booking in the database.
func CreateBookingHandler(c *fiber.Ctx) error {
	// Extract salonId from the URL parameters
	salonIDParam := c.Params("salonId")
	salonID, err := uuid.Parse(salonIDParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid salon ID"})
	}

	// Define the expected input structure
	var input struct {
		CustomerID     *string  `json:"customerId,omitempty"`     // Optional customer ID
		CustomerName   string   `json:"customerName"`             // Name of the customer
		CustomerNumber string   `json:"customerNumber"`           // Phone number of the customer
		TotalPrice     float64  `json:"totalPrice"`               // Total price of the booking
		AdvancePayment *float64 `json:"advancePayment,omitempty"` // Optional advance payment
		Notes          *string  `json:"notes,omitempty"`          // Optional notes for the booking
		BookingSlots   []struct {
			StartTime  string `json:"startTime"`  // Start time of the service (ISO 8601 format)
			EndTime    string `json:"endTime"`    // End time of the service (ISO 8601 format)
			StaffId    string `json:"staffId"`    // ID of the employee assigned to the service
			ServiceID  string `json:"serviceId"`  // ID of the service being booked
			IsPackaged bool   `json:"isPackaged"` // Indicates if the service is part of a package
		} `json:"bookingSlots"` // List of booking slots
	}

	// Parse the request body into the input struct
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON input"})
	}

	// Ensure booking slots are provided
	if len(input.BookingSlots) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bookingSlots cannot be empty"})
	}

	// Handle optional customer ID
	var customerID *uuid.UUID
	if input.CustomerID != nil && *input.CustomerID != "" {
		parsed, err := uuid.Parse(*input.CustomerID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid customer ID"})
		}
		customerID = &parsed
	} else {
		// If customer ID is not provided, validate customer name and number
		if input.CustomerName == "" || input.CustomerNumber == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Either customerId or (customerName + customerNumber) must be provided",
			})
		}
	}

	// Load the Sri Lanka timezone
	location, err := time.LoadLocation("Asia/Colombo")
	if err != nil {
		// Fallback to a fixed timezone if loading fails
		location = time.FixedZone("LKT", 5*3600+30*60)
	}

	// Initialize variables for booking slots and overall start/end times
	var (
		bookingSlots []model.BookingSlot
		startTime    time.Time
		endTime      time.Time
	)

	// Process each booking slot
	for i, slot := range input.BookingSlots {
		// Parse and convert start and end times
		sTime, err := time.Parse(time.RFC3339, slot.StartTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Invalid startTime in slot %d", i)})
		}
		eTime, err := time.Parse(time.RFC3339, slot.EndTime)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Invalid endTime in slot %d", i)})
		}
		sTime = sTime.In(location)
		eTime = eTime.In(location)

		// Validate staff and service IDs
		staffID, err := uuid.Parse(slot.StaffId)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Invalid staffId in slot %d", i)})
		}
		serviceID, err := uuid.Parse(slot.ServiceID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Invalid serviceId in slot %d", i)})
		}

		// Append the booking slot to the list
		bookingSlots = append(bookingSlots, model.BookingSlot{
			ID:         uuid.New(),
			StartTime:  sTime,
			EndTime:    eTime,
			StaffID:    staffID,
			ServiceID:  serviceID,
			IsPackaged: slot.IsPackaged,
		})

		// Update overall start and end times
		if i == 0 || sTime.Before(startTime) {
			startTime = sTime
		}
		if i == 0 || eTime.After(endTime) {
			endTime = eTime
		}
	}

	// Use zero value if AdvancePayment is not provided
	advance := 0.0
	if input.AdvancePayment != nil {
		advance = *input.AdvancePayment
	}

	// Build the booking object
	booking := &model.Booking{
		ID:             uuid.New(),
		SalonID:        salonID,
		CustomerID:     customerID,
		CustomerName:   input.CustomerName,
		CustomerNumber: input.CustomerNumber,
		BookingStatus:  "booked", // Default status is "booked"
		StartTime:      startTime,
		EndTime:        endTime,
		TotalPrice:     input.TotalPrice,
		AdvancePayment: advance,
		Notes:          input.Notes,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		BookingSlots:   bookingSlots,
	}

	// Assign the booking ID to each slot
	for i := range booking.BookingSlots {
		booking.BookingSlots[i].BookingID = booking.ID
	}

	// Insert the booking into the database
	if err := repository.CreateBooking(booking); err != nil {
		utils.Error("Failed to create booking: " + err.Error())
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create booking"})
	}

	// Return the created booking as the response
	return c.Status(fiber.StatusCreated).JSON(booking)
}
