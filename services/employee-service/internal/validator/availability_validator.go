package validator

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// AvailabilityInput represents the input for checking employee availability
type AvailabilityInput struct {
	Service   []string `json:"service"`
	StartTime string   `json:"starttime"`
	EndTime   string   `json:"endtime"`
}

// ValidateAvailabilityInput validates and parses the availability input
// Returns: serviceIDs, startTime, endTime, date, error
func ValidateAvailabilityInput(input AvailabilityInput) ([]uuid.UUID, time.Time, time.Time, time.Time, error) {
	// 1. Validate required fields
	if len(input.Service) == 0 {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("service array cannot be empty")
	}
	if input.StartTime == "" {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("starttime is required")
	}
	if input.EndTime == "" {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("endtime is required")
	}

	// 2. Parse and validate service IDs
	serviceIDs := make([]uuid.UUID, len(input.Service))
	for i, serviceStr := range input.Service {
		serviceID, err := uuid.Parse(serviceStr)
		if err != nil {
			return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("invalid service ID format at index %d: %s", i, serviceStr)
		}
		serviceIDs[i] = serviceID
	}

	// 3. Parse start and end times (expecting RFC3339 format with timezone)
	startTime, err := time.Parse(time.RFC3339, input.StartTime)
	if err != nil {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("invalid starttime format, expected RFC3339 (e.g., 2024-12-09T13:00:00+05:30)")
	}

	endTime, err := time.Parse(time.RFC3339, input.EndTime)
	if err != nil {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("invalid endtime format, expected RFC3339 (e.g., 2024-12-09T16:00:00+05:30)")
	}

	// 4. Convert times to Sri Lanka timezone (+05:30)
	sriLankaLocation, err := time.LoadLocation("Asia/Colombo")
	if err != nil {
		// Fallback to manual offset if timezone data is not available
		sriLankaLocation = time.FixedZone("LKT", 5*3600+30*60) // +05:30
	}

	startTime = startTime.In(sriLankaLocation)
	endTime = endTime.In(sriLankaLocation)

	// 5. Validate time logic
	if endTime.Before(startTime) || endTime.Equal(startTime) {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("endtime must be after starttime")
	}

	// 6. Check if start and end are on the same date
	startDate := time.Date(startTime.Year(), startTime.Month(), startTime.Day(), 0, 0, 0, 0, startTime.Location())
	endDate := time.Date(endTime.Year(), endTime.Month(), endTime.Day(), 0, 0, 0, 0, endTime.Location())
	
	if !startDate.Equal(endDate) {
		return nil, time.Time{}, time.Time{}, time.Time{}, fmt.Errorf("starttime and endtime must be on the same date")
	}

	// 7. Return parsed values
	return serviceIDs, startTime, endTime, startDate, nil
} 