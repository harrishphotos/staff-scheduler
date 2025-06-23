package validator

import (
	"fmt"
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/repository"
)

// ScheduleInput represents the data required to create a schedule
type ScheduleInput struct {
	EmployeeID  string `json:"employee_id"`
	DayOfWeek   int    `json:"day_of_week"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	ValidFrom   string `json:"valid_from"`
	ValidUntil  string `json:"valid_until"`
	Notes       string `json:"notes"`
}



// ValidateRequiredFields validates that all required fields are provided
func ValidateRequiredFields(input ScheduleInput) error {
	if input.EmployeeID == "" || input.StartTime == "" || input.EndTime == "" || input.ValidFrom == "" {
		return fmt.Errorf("employee_id, start_time, end_time, and valid_from are required")
	}
	return nil
}

// ValidateEmployeeExists validates that the employee ID is valid and the employee exists
func ValidateEmployeeExists(employeeIDStr string) (uuid.UUID, error) {
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid employee ID format")
	}

	// Check if employee exists
	_, err = repository.GetEmployeeByID(employeeID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("employee not found")
	}
	
	return employeeID, nil
}

// ValidateAndNormalizeTimes validates time formats and checks business rules for time relationships
// Now returns time.Time objects instead of strings
func ValidateAndNormalizeTimes(startTimeStr, endTimeStr string) (time.Time, time.Time, error) {
	if !IsValidTimeFormat(startTimeStr) {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid start_time format, use HH:MM:SS or HH:MM")
	}
	if !IsValidTimeFormat(endTimeStr) {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid end_time format, use HH:MM:SS or HH:MM")
	}

	startTimeStr = NormalizeTimeFormat(startTimeStr)
	endTimeStr = NormalizeTimeFormat(endTimeStr)
	
	// Parse times for comparison and return
	parsedStartTime, _ := time.Parse("15:04:05", startTimeStr)
	parsedEndTime, _ := time.Parse("15:04:05", endTimeStr)
	
	// Check if end time is before start time (potential midnight crossing)
	if parsedEndTime.Before(parsedStartTime) {
		// For midnight crossing schedules, we'll allow it but add a note
		utils.Info(fmt.Sprintf("Schedule crosses midnight: %s - %s", startTimeStr, endTimeStr))
	} else if parsedStartTime.Equal(parsedEndTime) {
		// Start and end times cannot be the same
		return time.Time{}, time.Time{}, fmt.Errorf("start_time and end_time cannot be the same")
	}
	
	return parsedStartTime, parsedEndTime, nil
}

// ValidateAndParseDates validates date formats and checks business rules for date relationships
func ValidateAndParseDates(validFromStr, validUntilStr string) (time.Time, *time.Time, bool, error) {
	validFrom, err := time.Parse("2006-01-02", validFromStr)
	if err != nil {
		return time.Time{}, nil, false, fmt.Errorf("invalid valid_from date format, use YYYY-MM-DD")
	}

	// Check if validFrom is not in the past
	today := time.Now().Truncate(24 * time.Hour)
	if validFrom.Before(today) {
		return time.Time{}, nil, false, fmt.Errorf("valid_from date cannot be in the past")
	}

	var validUntil *time.Time
	var isRecurring bool

	// Process validUntil based on the rules:
	// 1. null or empty = recurring schedule with no end date (infinite)
	// 2. date = recurring schedule with end date
	if validUntilStr == "null" || validUntilStr == "" {
		// Recurring schedule with no end date (infinite)
		validUntil = nil
		isRecurring = true
	} else {
		// Recurring schedule with end date
		parsedValidUntil, err := time.Parse("2006-01-02", validUntilStr)
		if err != nil {
			return time.Time{}, nil, false, fmt.Errorf("invalid valid_until date format, use YYYY-MM-DD")
		}
		
		// Check if valid_until is after valid_from
		if parsedValidUntil.Before(validFrom) {
			return time.Time{}, nil, false, fmt.Errorf("valid_until must be after or equal to valid_from")
		}
		
		// Add maximum date range validation
		maxDateRange := validFrom.AddDate(1, 0, 0) // 1 year from validFrom
		if parsedValidUntil.After(maxDateRange) {
			return time.Time{}, nil, false, fmt.Errorf("valid_until cannot be more than 1 year from valid_from")
		}
		
		validUntil = &parsedValidUntil
		
		// Determine if schedule is recurring (validUntil different from validFrom)
		isRecurring = !parsedValidUntil.Equal(validFrom)
	}

	return validFrom, validUntil, isRecurring, nil
}

// ValidateDayOfWeek validates that the day of week is valid
func ValidateDayOfWeek(dayOfWeek int, isRecurring bool) error {
	if isRecurring && (dayOfWeek < 0 || dayOfWeek > 6) {
		return fmt.Errorf("day_of_week must be between 0 (Sunday) and 6 (Saturday)")
	}
	return nil
}

// IsValidTimeFormat checks if the time string is in a valid format
func IsValidTimeFormat(timeStr string) bool {
	_, err1 := time.Parse("15:04:05", timeStr)
	_, err2 := time.Parse("15:04", timeStr)
	return err1 == nil || err2 == nil
}

// NormalizeTimeFormat ensures a consistent time format
func NormalizeTimeFormat(timeStr string) string {
	// If the format is already HH:MM:SS, return as is
	if _, err := time.Parse("15:04:05", timeStr); err == nil {
		return timeStr
	}
	
	// If the format is HH:MM, append :00 for seconds
	if t, err := time.Parse("15:04", timeStr); err == nil {
		return fmt.Sprintf("%02d:%02d:00", t.Hour(), t.Minute())
	}
	
	// Fallback (should not happen due to validation)
	return timeStr
} 