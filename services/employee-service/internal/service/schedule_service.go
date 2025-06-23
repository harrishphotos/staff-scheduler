package service

import (
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// CalculateDayOfWeek determines the day of week based on recurrence
func CalculateDayOfWeek(dayOfWeek int, validFrom time.Time, isRecurring bool) int {
	// Always use the provided dayOfWeek value, never infer from date
	// The user explicitly specifies which day of week this schedule is for
	return dayOfWeek
}

// BuildScheduleModel creates a schedule model from validated inputs
func BuildScheduleModel(
	employeeID uuid.UUID, 
	dayOfWeek int, 
	startTime time.Time, 
	endTime time.Time, 
	validFrom time.Time, 
	validUntil *time.Time, 
	notes string,
) *model.Schedule {
	return &model.Schedule{
		EmployeeID:  employeeID,
		DayOfWeek:   dayOfWeek,
		StartTime:   startTime,
		EndTime:     endTime,
		ValidFrom:   validFrom,
		ValidUntil:  validUntil,
		Notes:       notes,
	}
}

// CheckForDuplicateSchedule checks if a schedule with the same attributes already exists
func CheckForDuplicateSchedule(schedule *model.Schedule, excludeID *uuid.UUID) error {
	hasDuplicate, err := repository.CheckDuplicateSchedule(
		schedule.EmployeeID,
		schedule.DayOfWeek,
		schedule.ValidFrom,
		schedule.ValidUntil,
		excludeID,
	)
	if err != nil {
		utils.Error("Failed to check for duplicate schedules: " + err.Error())
		return err
	}
	if hasDuplicate {
		return &DuplicateScheduleError{}
	}
	return nil
}

// DuplicateScheduleError represents an error when a schedule duplicate is found
type DuplicateScheduleError struct{}

func (e *DuplicateScheduleError) Error() string {
	return "a duplicate schedule already exists for this employee with the same day and date range"
}

// DetermineRecurrenceType determines if a schedule is recurring based on validFrom and validUntil
func DetermineRecurrenceType(validFrom time.Time, validUntil *time.Time) bool {
	// If validUntil is nil, it's a recurring schedule with no end date
	if validUntil == nil {
		return true
	}
	
	// If validUntil equals validFrom, it's a one-time schedule
	return !validUntil.Equal(validFrom)
} 