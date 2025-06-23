package handler

import (
	"fmt"
	"services/booking-service/internal/client"
	"services/booking-service/internal/model"
	"services/booking-service/internal/repository"
	"services/shared/utils"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AvailabilitySlot represents a single availability time slot
type AvailabilitySlot struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

// FinalAvailabilityResponse represents the final response structure for availability
type FinalAvailabilityResponse struct {
	StaffId      string             `json:"staffId"`
	ServiceIds   []string           `json:"serviceIds"`
	Availability []AvailabilitySlot `json:"availability"`
}

func AvailabilityHandler(c *fiber.Ctx) error {
	var input struct {
		ServiceIds []string `json:"serviceIds"`
		StartTime  string   `json:"starttime"`
		EndTime    string   `json:"endtime"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
	}

	// Log the input data to the terminal
	fmt.Printf("Received availability input: %+v\n", input)

	// Validate required fields
	if len(input.ServiceIds) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "serviceIds array cannot be empty"})
	}
	if input.StartTime == "" {
		return c.Status(400).JSON(fiber.Map{"error": "starttime is required"})
	}
	if input.EndTime == "" {
		return c.Status(400).JSON(fiber.Map{"error": "endtime is required"})
	}

	// Create employee client
	employeeClient := client.NewEmployeeClient()

	// Forward request to employee service
	employeeReq := client.EmployeeAvailabilityRequest{
		Service:   input.ServiceIds,
		StartTime: input.StartTime,
		EndTime:   input.EndTime,
	}

	employeeAvailability, err := employeeClient.GetEmployeeAvailability(employeeReq)
	if err != nil {
		utils.Error("Failed to get employee availability: " + err.Error())
		return c.Status(500).JSON(fiber.Map{"error": "failed to get employee availability"})
	}

	// Parse the request date from starttime
	requestDate, err := time.Parse(time.RFC3339, input.StartTime)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid start time format"})
	}

	// Convert to Sri Lanka timezone (+05:30) like employee service
	sriLankaLocation, err := time.LoadLocation("Asia/Colombo")
	if err != nil {
		// Fallback to manual offset if timezone data is not available
		sriLankaLocation = time.FixedZone("LKT", 5*3600+30*60) // +05:30
	}
	requestDate = requestDate.In(sriLankaLocation)

	// Debug: Log the parsed date
	fmt.Printf("Parsed request date: %v (location: %v)\n", requestDate, requestDate.Location())

	// For each employee, subtract booked time from their EWT
	for i := range employeeAvailability {
		employee := &employeeAvailability[i]
		
		// Parse employee ID
		employeeID, err := uuid.Parse(employee.EmployeeID)
		if err != nil {
			utils.Error(fmt.Sprintf("Invalid employee ID format: %s", employee.EmployeeID))
			continue
		}

		// Debug: Log employee processing
		fmt.Printf("Processing employee: %s\n", employee.EmployeeID)

		// Get employee's bookings for the date
		bookedSlots, err := repository.GetEmployeeBookingSlotsForDate(employeeID, requestDate)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to get bookings for employee %s: %v", employee.EmployeeID, err))
			continue
		}

		// Debug: Log found booking slots
		fmt.Printf("Found %d booking slots for employee %s\n", len(bookedSlots), employee.EmployeeID)
		for _, slot := range bookedSlots {
			fmt.Printf("  Slot: %v to %v\n", slot.StartTime, slot.EndTime)
		}

		// Calculate modified EWT
		modifiedEWT, err := calculateModifiedEWT(employee.EWT, bookedSlots, requestDate)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to calculate modified EWT for employee %s: %v", employee.EmployeeID, err))
			continue
		}

		// Update the EWT
		employee.EWT = modifiedEWT
	}

	// Transform to new response structure
	finalResponse := make([]FinalAvailabilityResponse, len(employeeAvailability))
	for i, employee := range employeeAvailability {
		// Convert EWT strings to availability slots with ISO timestamps
		availabilitySlots, err := convertEWTToAvailabilitySlots(employee.EWT, requestDate, sriLankaLocation)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to convert EWT to availability slots for employee %s: %v", employee.EmployeeID, err))
			continue
		}

		finalResponse[i] = FinalAvailabilityResponse{
			StaffId:      employee.EmployeeID, // Renamed from EmployeeID to StaffId
			ServiceIds:   employee.Service,    // Renamed from Service to ServiceIds
			Availability: availabilitySlots,   // Renamed from EWT to Availability with new structure
		}
	}

	return c.JSON(finalResponse)
}

// convertEWTToAvailabilitySlots converts EWT time ranges to availability slots with ISO timestamps
func convertEWTToAvailabilitySlots(ewt []string, date time.Time, location *time.Location) ([]AvailabilitySlot, error) {
	var slots []AvailabilitySlot

	for _, timeRange := range ewt {
		// Parse format like "11:00-12:00"
		parts := strings.Split(timeRange, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid time range format: %s", timeRange)
		}

		startTime, err := parseTimeOnDate(parts[0], date)
		if err != nil {
			return nil, fmt.Errorf("failed to parse start time %s: %v", parts[0], err)
		}

		endTime, err := parseTimeOnDate(parts[1], date)
		if err != nil {
			return nil, fmt.Errorf("failed to parse end time %s: %v", parts[1], err)
		}

		// Ensure times are in Sri Lanka timezone
		startTime = startTime.In(location)
		endTime = endTime.In(location)

		// Convert to ISO format with +05:30 timezone
		slots = append(slots, AvailabilitySlot{
			Start: startTime.Format(time.RFC3339),
			End:   endTime.Format(time.RFC3339),
		})
	}

	return slots, nil
}

// TimeSlot represents a time period
type TimeSlot struct {
	Start time.Time
	End   time.Time
}

// calculateModifiedEWT subtracts booked time slots from available EWT slots
func calculateModifiedEWT(originalEWT []string, bookedSlots []model.BookingSlot, date time.Time) ([]string, error) {
	// Convert EWT strings to TimeSlot objects
	availableSlots, err := parseEWTToTimeSlots(originalEWT, date)
	if err != nil {
		return nil, fmt.Errorf("failed to parse EWT: %v", err)
	}

	// Convert booked slots to TimeSlot objects
	bookedTimeSlots := bookingSlotsToTimeSlots(bookedSlots)

	// Remove booked time from available slots
	remainingSlots := removeBookedTimeFromSlots(availableSlots, bookedTimeSlots)

	// Convert back to EWT string format
	return timeSlotsToEWTStrings(remainingSlots), nil
}

// parseEWTToTimeSlots converts EWT strings like "11:00-12:00" to TimeSlot objects
func parseEWTToTimeSlots(ewt []string, date time.Time) ([]TimeSlot, error) {
	var slots []TimeSlot

	for _, timeRange := range ewt {
		// Parse format like "11:00-12:00"
		parts := strings.Split(timeRange, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid time range format: %s", timeRange)
		}

		startTime, err := parseTimeOnDate(parts[0], date)
		if err != nil {
			return nil, fmt.Errorf("failed to parse start time %s: %v", parts[0], err)
		}

		endTime, err := parseTimeOnDate(parts[1], date)
		if err != nil {
			return nil, fmt.Errorf("failed to parse end time %s: %v", parts[1], err)
		}

		slots = append(slots, TimeSlot{Start: startTime, End: endTime})
	}

	return slots, nil
}

// parseTimeOnDate parses time string like "11:00" and creates time.Time on specific date
func parseTimeOnDate(timeStr string, date time.Time) (time.Time, error) {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid time format: %s", timeStr)
	}

	hour, err := strconv.Atoi(parts[0])
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid hour: %s", parts[0])
	}

	minute, err := strconv.Atoi(parts[1])
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid minute: %s", parts[1])
	}

	return time.Date(date.Year(), date.Month(), date.Day(), hour, minute, 0, 0, date.Location()), nil
}

// bookingSlotsToTimeSlots converts booking slots to TimeSlot objects
func bookingSlotsToTimeSlots(bookingSlots []model.BookingSlot) []TimeSlot {
	var slots []TimeSlot
	for _, slot := range bookingSlots {
		slots = append(slots, TimeSlot{Start: slot.StartTime, End: slot.EndTime})
	}
	return slots
}

// removeBookedTimeFromSlots removes booked time ranges from available slots
func removeBookedTimeFromSlots(availableSlots, bookedSlots []TimeSlot) []TimeSlot {
	result := availableSlots

	// For each booked slot, remove it from all available slots
	for _, bookedSlot := range bookedSlots {
		result = removeTimeSlotFromSlots(result, bookedSlot)
	}

	return result
}

// removeTimeSlotFromSlots removes a specific time slot from a list of available slots
func removeTimeSlotFromSlots(slots []TimeSlot, toRemove TimeSlot) []TimeSlot {
	var result []TimeSlot

	for _, slot := range slots {
		// Check if there's any overlap between the slot and the time to remove
		// No overlap: keep the slot as is
		if slot.End.Before(toRemove.Start) || slot.End.Equal(toRemove.Start) || 
		   slot.Start.After(toRemove.End) || slot.Start.Equal(toRemove.End) {
			result = append(result, slot)
			continue
		}

		// There's overlap, we need to split the slot
		// Case 1: Remove part overlaps the beginning of the slot
		if toRemove.Start.Before(slot.Start) || toRemove.Start.Equal(slot.Start) {
			// Keep the part after the removal
			if toRemove.End.Before(slot.End) {
				result = append(result, TimeSlot{Start: toRemove.End, End: slot.End})
			}
			// If toRemove.End >= slot.End, the entire slot is removed
		} else if toRemove.End.After(slot.End) || toRemove.End.Equal(slot.End) {
			// Remove part overlaps the end of the slot
			// Keep the part before the removal
			result = append(result, TimeSlot{Start: slot.Start, End: toRemove.Start})
		} else {
			// Remove part is in the middle of the slot, split into two
			result = append(result, TimeSlot{Start: slot.Start, End: toRemove.Start})
			result = append(result, TimeSlot{Start: toRemove.End, End: slot.End})
		}
	}

	return result
}

// timeSlotsToEWTStrings converts TimeSlot objects back to EWT string format
func timeSlotsToEWTStrings(slots []TimeSlot) []string {
	var result []string
	for _, slot := range slots {
		startStr := slot.Start.Format("15:04")
		endStr := slot.End.Format("15:04")
		result = append(result, fmt.Sprintf("%s-%s", startStr, endStr))
	}
	return result
} 