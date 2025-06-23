package service

import (
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// OverlappingOnetimeBlockError represents an error when a one-time block overlaps with an existing one.
type OverlappingOnetimeBlockError struct{}

func (e *OverlappingOnetimeBlockError) Error() string {
	return "this one-time block overlaps with an existing block for the same employee"
}

// BuildOnetimeBlockModel creates a one-time block model from validated inputs.
func BuildOnetimeBlockModel(
	employeeID uuid.UUID,
	startDateTime time.Time,
	endDateTime time.Time,
	reason string,
) *model.OnetimeBlock {
	return &model.OnetimeBlock{
		EmployeeID:    employeeID,
		StartDateTime: startDateTime,
		EndDateTime:   endDateTime,
		Reason:        reason,
	}
}

// CheckForOverlappingOnetimeBlock is a service-level function to check for overlaps.
func CheckForOverlappingOnetimeBlock(ob *model.OnetimeBlock, excludeID *uuid.UUID) error {
	hasOverlap, err := repository.CheckOverlappingOnetimeBlock(
		ob.EmployeeID,
		ob.StartDateTime,
		ob.EndDateTime,
		excludeID,
	)
	if err != nil {
		utils.Error("Failed to check for overlapping one-time blocks: " + err.Error())
		return err // Propagate DB error
	}
	if hasOverlap {
		return &OverlappingOnetimeBlockError{}
	}
	return nil
} 