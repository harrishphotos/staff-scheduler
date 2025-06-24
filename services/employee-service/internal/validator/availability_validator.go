package validator

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// ValidateAvailabilityRequest validates the availability request input
func ValidateAvailabilityRequest(req model.AvailabilityRequest) error {
	// Validate required fields
	if req.Date == "" {
		return fmt.Errorf("date is required")
	}
	if req.EmployeeID == "" {
		return fmt.Errorf("employee_id is required")
	}
	
	return nil
}

// ValidateAndParseAvailabilityDate validates and parses the date from the request
// Supports both date-only and full ISO datetime formats
func ValidateAndParseAvailabilityDate(dateStr string) (time.Time, error) {
	// Try parsing as full ISO datetime first (RFC3339)
	if date, err := time.Parse(time.RFC3339, dateStr); err == nil {
		// Truncate to date only (start of day) for consistency
		return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location()), nil
	}
	
	// Try parsing as date only (YYYY-MM-DD)
	if date, err := time.Parse("2006-01-02", dateStr); err == nil {
		return date, nil
	}
	
	// Try parsing as other common ISO formats
	formats := []string{
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05.000Z",
		"2006-01-02T15:04:05-07:00",
		"2006-01-02T15:04:05.000-07:00",
	}
	
	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			// Truncate to date only (start of day) for consistency
			return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location()), nil
		}
	}
	
	return time.Time{}, fmt.Errorf("invalid date format. Expected ISO 8601 format (e.g., '2025-06-10' or '2025-06-10T00:00:00Z')")
}

// ValidateAvailabilityEmployeeID validates and parses the employee ID
func ValidateAvailabilityEmployeeID(employeeIDStr string) (uuid.UUID, error) {
	employeeID, err := uuid.Parse(employeeIDStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid employee ID format")
	}
	
	return employeeID, nil
}

// ValidateAvailabilityDateNotInPast validates that the requested date is not in the past
// This is optional validation - you may want to allow past dates for historical data
func ValidateAvailabilityDateNotInPast(date time.Time) error {
	today := time.Now().Truncate(24 * time.Hour)
	if date.Before(today) {
		return fmt.Errorf("cannot retrieve availability for past dates")
	}
	
	return nil
}

// ValidateAvailabilityDateRange validates that the requested date is within a reasonable range
// This prevents queries for dates too far in the future where no schedules might exist
func ValidateAvailabilityDateRange(date time.Time) error {
	today := time.Now().Truncate(24 * time.Hour)
	maxFutureDate := today.AddDate(2, 0, 0) // 2 years in the future
	
	if date.After(maxFutureDate) {
		return fmt.Errorf("date is too far in the future (maximum 2 years ahead)")
	}
	
	return nil
} 