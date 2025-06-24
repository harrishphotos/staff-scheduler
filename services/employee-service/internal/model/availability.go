package model

import (
	"time"

	"github.com/google/uuid"
)

// AvailabilityRequest represents the request structure for availability endpoint
type AvailabilityRequest struct {
	Date       string `json:"date" validate:"required"`       // ISO 8601 date format
	EmployeeID string `json:"employee_id" validate:"required"` // UUID string
}

// AvailabilityResponse represents the response structure for availability endpoint
type AvailabilityResponse struct {
	Date         time.Time                `json:"date"`
	EmployeeID   uuid.UUID                `json:"employee_id"`
	Schedule     *AvailabilitySchedule    `json:"schedule"`
	OneTimeBlocks []AvailabilityBlock     `json:"onetimeblocks"`
	Breaks       []AvailabilityBreak      `json:"breaks"`
}

// AvailabilitySchedule represents the schedule information in availability response
type AvailabilitySchedule struct {
	StartTime time.Time `json:"start_time"` // Full ISO datetime
	EndTime   time.Time `json:"end_time"`   // Full ISO datetime
}

// AvailabilityBlock represents a one-time block in availability response
type AvailabilityBlock struct {
	StartTime time.Time `json:"start_time"` // Full ISO datetime
	EndTime   time.Time `json:"end_time"`   // Full ISO datetime
	Reason    string    `json:"reason"`
}

// AvailabilityBreak represents a break in availability response
type AvailabilityBreak struct {
	StartTime time.Time `json:"start_time"` // Full ISO datetime
	EndTime   time.Time `json:"end_time"`   // Full ISO datetime
	Reason    string    `json:"reason"`
}

// TimeRange represents a simple time range for internal calculations
type TimeRange struct {
	Start time.Time
	End   time.Time
}

// HasOverlap checks if this time range overlaps with another time range
func (tr TimeRange) HasOverlap(other TimeRange) bool {
	return tr.Start.Before(other.End) && tr.End.After(other.Start)
}

// GetIntersection returns the intersection of two time ranges, if any
func (tr TimeRange) GetIntersection(other TimeRange) *TimeRange {
	if !tr.HasOverlap(other) {
		return nil
	}
	
	start := tr.Start
	if other.Start.After(start) {
		start = other.Start
	}
	
	end := tr.End
	if other.End.Before(end) {
		end = other.End
	}
	
	return &TimeRange{Start: start, End: end}
}

// IsValid checks if the time range is valid (start before end)
func (tr TimeRange) IsValid() bool {
	return tr.Start.Before(tr.End)
} 