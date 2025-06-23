package validator

import (
	"fmt"
	"time"
)

// OnetimeBlockInput represents the data required to create a one-time block.
type OnetimeBlockInput struct {
	EmployeeID    string `json:"employee_id"`
	StartDateTime string `json:"start_date_time"`
	EndDateTime   string `json:"end_date_time"`
	Reason        string `json:"reason"`
}

// ValidateOnetimeBlockRequiredFields validates that all required fields for a one-time block are provided.
func ValidateOnetimeBlockRequiredFields(input OnetimeBlockInput) error {
	if input.EmployeeID == "" || input.StartDateTime == "" || input.EndDateTime == "" || input.Reason == "" {
		return fmt.Errorf("employee_id, start_date_time, end_date_time, and reason are required for one-time block")
	}
	return nil
}

// ValidateAndParseOnetimeBlockDateTimes parses and validates start and end date-times.
// It ensures that the format is correct and that end date-time is after start date-time.
func ValidateAndParseOnetimeBlockDateTimes(startDateTimeStr, endDateTimeStr string) (time.Time, time.Time, error) {
	// Parse date-times using RFC3339 format (which includes timezone)
	startDateTime, err := time.Parse(time.RFC3339, startDateTimeStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid start_date_time format, should be in RFC3339 format (e.g., 2024-05-23T14:30:00Z)")
	}

	endDateTime, err := time.Parse(time.RFC3339, endDateTimeStr)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid end_date_time format, should be in RFC3339 format (e.g., 2024-05-23T16:30:00Z)")
	}

	// Validate that end date-time is after start date-time
	if !endDateTime.After(startDateTime) {
		return time.Time{}, time.Time{}, fmt.Errorf("end_date_time must be after start_date_time")
	}

	return startDateTime, endDateTime, nil
} 