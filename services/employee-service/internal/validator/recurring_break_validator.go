package validator

import (
	"fmt"
	"time"
)

type RecurringBreakInput struct {
	EmployeeID string `json:"employee_id"`
	DayOfWeek  *int   `json:"day_of_week"` // Pointer to detect if field was provided
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
	Reason     string `json:"reason"`
}

// ValidateRecurringBreakRequiredFields validates that all required fields for a recurring break are provided.
func ValidateRecurringBreakRequiredFields(input RecurringBreakInput) error {
	if input.EmployeeID == "" || input.StartTime == "" || input.EndTime == "" || input.Reason == "" || input.DayOfWeek == nil {
		return fmt.Errorf("employee_id, day_of_week, start_time, end_time, and reason are required for recurring break")
	}
	return nil
}

func ValidateAndParseRecurringBreakTimes(startTimeStr, endTimeStr string) (time.Time, time.Time, error) {
	// Re-use the existing validator from schedule_validator.go
	return ValidateAndNormalizeTimes(startTimeStr, endTimeStr) 
}

// ValidateRecurringBreakDayOfWeek uses the existing Schedule DayOfWeek validator.
// Note: For recurring breaks, DayOfWeek is always relevant, so isRecurring is true.
func ValidateRecurringBreakDayOfWeek(dayOfWeek int) error {
	// Re-use the existing validator from schedule_validator.go. Pass true for isRecurring.
	return ValidateDayOfWeek(dayOfWeek, true) 
}

