package service

import (
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// DuplicateRecurringBreakError represents an error when a duplicate recurring break is found.
type DuplicateRecurringBreakError struct{}

func (e *DuplicateRecurringBreakError) Error() string {
	return "a recurring break with the same employee, day, and reason already exists"
}

// OverlappingRecurringBreakError represents an error when a recurring break overlaps with an existing one.
type OverlappingRecurringBreakError struct{}

func (e *OverlappingRecurringBreakError) Error() string {
	return "this recurring break overlaps with an existing break for the same employee on the same day"
}

// BuildRecurringBreakModel creates a recurring break model from validated inputs.
func BuildRecurringBreakModel(
	employeeID uuid.UUID,
	dayOfWeek int,
	startTime time.Time,
	endTime time.Time,
	reason string,
) *model.RecurringBreak {
	return &model.RecurringBreak{
		EmployeeID: employeeID,
		DayOfWeek:  dayOfWeek,
		StartTime:  startTime,
		EndTime:    endTime,
		Reason:     reason,
	}
}

// CheckForDuplicateRecurringBreak is a service-level function to check for duplicates.
func CheckForDuplicateRecurringBreak(rb *model.RecurringBreak, excludeID *uuid.UUID) error {
	hasDuplicate, err := repository.CheckDuplicateRecurringBreak(
		rb.EmployeeID,
		rb.DayOfWeek,
		rb.Reason,
		excludeID,
	)
	if err != nil {
		utils.Error("Failed to check for duplicate recurring breaks: " + err.Error())
		return err // Propagate DB error
	}
	if hasDuplicate {
		return &DuplicateRecurringBreakError{}
	}
	return nil
}

// CheckForOverlappingRecurringBreak is a service-level function to check for overlaps.
func CheckForOverlappingRecurringBreak(rb *model.RecurringBreak, excludeID *uuid.UUID) error {
	hasOverlap, err := repository.CheckOverlappingRecurringBreak(
		rb.EmployeeID,
		rb.DayOfWeek,
		rb.StartTime,
		rb.EndTime,
		excludeID,
	)
	if err != nil {
		utils.Error("Failed to check for overlapping recurring breaks: " + err.Error())
		return err // Propagate DB error
	}
	if hasOverlap {
		return &OverlappingRecurringBreakError{}
	}
	return nil
} 