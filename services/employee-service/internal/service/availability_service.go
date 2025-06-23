package service

import (
	"fmt"
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// AvailableEmployee represents an employee with their available time slots
type AvailableEmployee struct {
	EmployeeID     uuid.UUID   `json:"employee_id"`
	ServiceIDs     []uuid.UUID `json:"service_ids"`
	AvailableSlots []string    `json:"available_slots"`
}

// TimeSlot represents a time period
type TimeSlot struct {
	Start time.Time
	End   time.Time
}

// GetAvailableEmployeesForServices finds all employees available for given services within specified time range
func GetAvailableEmployeesForServices(serviceIDs []uuid.UUID, requestStartTime, requestEndTime, date time.Time) ([]AvailableEmployee, error) {
	var availableEmployees []AvailableEmployee
	employeeServiceMap := make(map[uuid.UUID][]uuid.UUID) // employeeID -> list of serviceIDs they can provide

	// 1. Get all employees who can provide any of the requested services
	for _, serviceID := range serviceIDs {
		employeeServices, err := repository.GetEmployeeServicesByServiceID(serviceID)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to get employees for service %s: %v", serviceID.String(), err))
			continue
		}

		// Build map of employee -> services they can provide from the request
		for _, es := range employeeServices {
			if existingServices, exists := employeeServiceMap[es.EmployeeID]; exists {
				employeeServiceMap[es.EmployeeID] = append(existingServices, serviceID)
			} else {
				employeeServiceMap[es.EmployeeID] = []uuid.UUID{serviceID}
			}
		}
	}

	// 2. For each employee, calculate their available time slots
	for employeeID, matchingServices := range employeeServiceMap {
		utils.Info(fmt.Sprintf("DEBUG: Processing employee %s", employeeID.String()))
		availableSlots, err := calculateEmployeeAvailability(employeeID, requestStartTime, requestEndTime, date)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to calculate availability for employee %s: %v", employeeID.String(), err))
			continue
		}

		utils.Info(fmt.Sprintf("DEBUG: Employee %s has %d available slots: %v", employeeID.String(), len(availableSlots), availableSlots))

		// Only include employee if they have available time slots
		if len(availableSlots) > 0 {
			availableEmployees = append(availableEmployees, AvailableEmployee{
				EmployeeID:     employeeID,
				ServiceIDs:     matchingServices,
				AvailableSlots: availableSlots,
			})
		}
	}

	return availableEmployees, nil
}

// calculateEmployeeAvailability calculates available time slots for an employee on a specific date
func calculateEmployeeAvailability(employeeID uuid.UUID, requestStartTime, requestEndTime, date time.Time) ([]string, error) {
	// 1. Check for one-time blocks that overlap with the requested time range
	hasOneTimeConflict, err := checkOneTimeBlockConflict(employeeID, requestStartTime, requestEndTime)
	if err != nil {
		return nil, err
	}
	if hasOneTimeConflict {
		// Employee is unavailable due to one-time block, skip them entirely
		return []string{}, nil
	}

	// 2. Get employee's schedule for the requested date
	schedules, err := repository.GetEmployeeSchedulesForDate(employeeID, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get schedules for employee %s: %v", employeeID.String(), err)
	}

	if len(schedules) == 0 {
		// Employee has no schedule for this date
		return []string{}, nil
	}

	// 3. Select the most recent valid schedule (highest valid_from date)
	// This handles multiple schedules for the same day where the most recent one takes priority
	var activeSchedule *model.Schedule
	for i := range schedules {
		if activeSchedule == nil || schedules[i].ValidFrom.After(activeSchedule.ValidFrom) {
			activeSchedule = &schedules[i]
		}
	}

	// 4. Get recurring breaks for the day of week
	dayOfWeek := int(date.Weekday())
	recurringBreaks, err := getRecurringBreaksForDay(employeeID, dayOfWeek)
	if err != nil {
		return nil, err
	}

	// 5. Calculate available time slots for the active schedule only
	// Convert schedule times to full datetime for the requested date
	scheduleStart := time.Date(date.Year(), date.Month(), date.Day(),
		activeSchedule.StartTime.Hour(), activeSchedule.StartTime.Minute(), activeSchedule.StartTime.Second(), 0, date.Location())
	scheduleEnd := time.Date(date.Year(), date.Month(), date.Day(),
		activeSchedule.EndTime.Hour(), activeSchedule.EndTime.Minute(), activeSchedule.EndTime.Second(), 0, date.Location())

	// Calculate available slots within this schedule (excluding recurring breaks)
	allAvailableSlots := calculateAvailableSlotsInSchedule(scheduleStart, scheduleEnd, recurringBreaks, date)

	// 6. Find intersection with requested time range
	requestedSlot := TimeSlot{Start: requestStartTime, End: requestEndTime}
	intersectionSlots := findIntersectionSlots(allAvailableSlots, requestedSlot)

	// 7. Convert to string format (24hr)
	return formatTimeSlotsToStrings(intersectionSlots), nil
}

// checkOneTimeBlockConflict checks if employee has any one-time blocks that overlap with requested time
func checkOneTimeBlockConflict(employeeID uuid.UUID, requestStartTime, requestEndTime time.Time) (bool, error) {
	// Get all one-time blocks for this employee
	oneTimeBlocks, err := repository.GetEmployeeOnetimeBlocks(employeeID)
	if err != nil {
		return false, fmt.Errorf("failed to get one-time blocks: %v", err)
	}

	// Check for overlap with any one-time block
	for _, block := range oneTimeBlocks {
		// Check if there's any overlap between requested time and the block
		// Overlap condition: (block.start < request.end) AND (block.end > request.start)
		if block.StartDateTime.Before(requestEndTime) && block.EndDateTime.After(requestStartTime) {
			return true, nil // Found overlap, employee is unavailable
		}
	}

	return false, nil
}

// getRecurringBreaksForDay gets all recurring breaks for an employee on a specific day of week
func getRecurringBreaksForDay(employeeID uuid.UUID, dayOfWeek int) ([]model.RecurringBreak, error) {
	allBreaks, err := repository.GetEmployeeRecurringBreaks(employeeID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recurring breaks: %v", err)
	}

	// Filter breaks for the specific day of week
	var dayBreaks []model.RecurringBreak
	for _, breakItem := range allBreaks {
		if breakItem.DayOfWeek == dayOfWeek {
			dayBreaks = append(dayBreaks, breakItem)
		}
	}

	return dayBreaks, nil
}

// calculateAvailableSlotsInSchedule calculates available time slots within a schedule, excluding recurring breaks
func calculateAvailableSlotsInSchedule(scheduleStart, scheduleEnd time.Time, recurringBreaks []model.RecurringBreak, date time.Time) []TimeSlot {
	// Start with the full schedule as one slot
	slots := []TimeSlot{{Start: scheduleStart, End: scheduleEnd}}

	// Remove each recurring break from the available slots
	for _, breakItem := range recurringBreaks {
		// Convert break times to full datetime for the requested date
		breakStart := time.Date(date.Year(), date.Month(), date.Day(),
			breakItem.StartTime.Hour(), breakItem.StartTime.Minute(), breakItem.StartTime.Second(), 0, date.Location())
		breakEnd := time.Date(date.Year(), date.Month(), date.Day(),
			breakItem.EndTime.Hour(), breakItem.EndTime.Minute(), breakItem.EndTime.Second(), 0, date.Location())

		slots = removeTimeSlotFromSlots(slots, TimeSlot{Start: breakStart, End: breakEnd})
	}

	return slots
}

// removeTimeSlotFromSlots removes a time slot from a list of time slots
func removeTimeSlotFromSlots(slots []TimeSlot, toRemove TimeSlot) []TimeSlot {
	var result []TimeSlot

	for _, slot := range slots {
		// Check if there's any overlap between the slot and the time to remove
		// No overlap: keep the slot as is
		if slot.End.Before(toRemove.Start) || slot.Start.After(toRemove.End) || slot.End.Equal(toRemove.Start) || slot.Start.Equal(toRemove.End) {
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

// findIntersectionSlots finds the intersection between available slots and the requested time slot
func findIntersectionSlots(availableSlots []TimeSlot, requestedSlot TimeSlot) []TimeSlot {
	var intersections []TimeSlot

	for _, slot := range availableSlots {
		// Find intersection between slot and requested time
		intersectionStart := maxTime(slot.Start, requestedSlot.Start)
		intersectionEnd := minTime(slot.End, requestedSlot.End)

		// If there's a valid intersection (start < end)
		if intersectionStart.Before(intersectionEnd) {
			intersections = append(intersections, TimeSlot{
				Start: intersectionStart,
				End:   intersectionEnd,
			})
		}
	}

	return intersections
}

// formatTimeSlotsToStrings converts time slots to string format (24hr)
func formatTimeSlotsToStrings(slots []TimeSlot) []string {
	result := make([]string, len(slots))
	for i, slot := range slots {
		startStr := slot.Start.Format("15:04")
		endStr := slot.End.Format("15:04")
		result[i] = fmt.Sprintf("%s-%s", startStr, endStr)
	}
	return result
}

// Helper functions
func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

// GetEmployeesInSpotAtTime gets all employees who are currently in the salon at the specified time
func GetEmployeesInSpotAtTime(currentTime time.Time) ([]uuid.UUID, error) {
	var inSpotEmployees []uuid.UUID

	// Get all active employees
	allEmployees, err := repository.GetAllEmployees()
	if err != nil {
		return nil, fmt.Errorf("failed to get all employees: %v", err)
	}

	// Convert current time to Sri Lanka timezone for consistency
	sriLankaLocation, err := time.LoadLocation("Asia/Colombo")
	if err != nil {
		// Fallback to manual offset if timezone data is not available
		sriLankaLocation = time.FixedZone("LKT", 5*3600+30*60) // +05:30
	}
	currentTimeLocal := currentTime.In(sriLankaLocation)
	
	// For each employee, check if they are currently available (in spot)
	for _, employee := range allEmployees {
		// Skip inactive employees
		if !employee.IsActive {
			continue
		}

		// Check if employee is available at current time
		isInSpot, err := isEmployeeInSpotAtTime(employee.ID, currentTimeLocal)
		if err != nil {
			utils.Error(fmt.Sprintf("Failed to check if employee %s is in spot: %v", employee.ID.String(), err))
			continue
		}

		if isInSpot {
			inSpotEmployees = append(inSpotEmployees, employee.ID)
		}
	}

	return inSpotEmployees, nil
}

// isEmployeeInSpotAtTime checks if an employee is currently in the salon at the specified time
func isEmployeeInSpotAtTime(employeeID uuid.UUID, currentTime time.Time) (bool, error) {
	// 1. Check for one-time blocks that overlap with current time
	hasOneTimeConflict, err := checkOneTimeBlockConflict(employeeID, currentTime, currentTime.Add(time.Minute))
	if err != nil {
		return false, err
	}
	if hasOneTimeConflict {
		return false, nil // Employee is blocked
	}

	// 2. Get employee's schedule for current date
	schedules, err := repository.GetEmployeeSchedulesForDate(employeeID, currentTime)
	if err != nil {
		return false, fmt.Errorf("failed to get schedules: %v", err)
	}

	if len(schedules) == 0 {
		return false, nil // No schedule for today
	}

	// 3. Find the active schedule
	var activeSchedule *model.Schedule
	for i := range schedules {
		if activeSchedule == nil || schedules[i].ValidFrom.After(activeSchedule.ValidFrom) {
			activeSchedule = &schedules[i]
		}
	}

	// 4. Check if current time is within schedule hours
	scheduleStart := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(),
		activeSchedule.StartTime.Hour(), activeSchedule.StartTime.Minute(), activeSchedule.StartTime.Second(), 0, currentTime.Location())
	scheduleEnd := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(),
		activeSchedule.EndTime.Hour(), activeSchedule.EndTime.Minute(), activeSchedule.EndTime.Second(), 0, currentTime.Location())

	if currentTime.Before(scheduleStart) || currentTime.After(scheduleEnd) {
		return false, nil // Outside working hours
	}

	// 5. Check if current time falls within a recurring break
	dayOfWeek := int(currentTime.Weekday())
	recurringBreaks, err := getRecurringBreaksForDay(employeeID, dayOfWeek)
	if err != nil {
		return false, err
	}

	for _, breakItem := range recurringBreaks {
		breakStart := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(),
			breakItem.StartTime.Hour(), breakItem.StartTime.Minute(), breakItem.StartTime.Second(), 0, currentTime.Location())
		breakEnd := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(),
			breakItem.EndTime.Hour(), breakItem.EndTime.Minute(), breakItem.EndTime.Second(), 0, currentTime.Location())

		if !currentTime.Before(breakStart) && currentTime.Before(breakEnd) {
			return false, nil // Employee is on break
		}
	}

	return true, nil // Employee is in spot
} 