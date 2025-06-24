package service

import (
	"fmt"
	"time"

	"services/shared/utils"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
	"github.com/salobook/services/employee-service/internal/repository"
)

// AvailabilityService handles all business logic related to employee availability
type AvailabilityService struct{}

// NewAvailabilityService creates a new instance of AvailabilityService
func NewAvailabilityService() *AvailabilityService {
	return &AvailabilityService{}
}

// GetEmployeeAvailability calculates the complete availability for an employee on a specific date
// This includes schedule, one-time blocks, and recurring breaks with conflict resolution
func (s *AvailabilityService) GetEmployeeAvailability(employeeID uuid.UUID, date time.Time) (*model.AvailabilityResponse, error) {
	// Step 1: Validate employee exists
	exists, err := repository.CheckEmployeeExists(employeeID)
	if err != nil {
		utils.Error(fmt.Sprintf("Failed to check employee existence: %v", err))
		return nil, fmt.Errorf("internal server error")
	}
	if !exists {
		return nil, fmt.Errorf("employee not found")
	}

	// Step 2: Find applicable schedule for the date
	schedule, err := repository.GetEmployeeScheduleForDate(employeeID, date)
	if err != nil {
		utils.Error(fmt.Sprintf("Failed to get schedule for employee %s on date %s: %v", employeeID, date.Format("2006-01-02"), err))
		return nil, fmt.Errorf("internal server error")
	}
	if schedule == nil {
		return nil, fmt.Errorf("no schedule found for employee on this date")
	}

	// Step 3: Get one-time blocks that overlap with the date
	oneTimeBlocks, err := repository.GetEmployeeOneTimeBlocksForDate(employeeID, date)
	if err != nil {
		utils.Error(fmt.Sprintf("Failed to get one-time blocks for employee %s on date %s: %v", employeeID, date.Format("2006-01-02"), err))
		return nil, fmt.Errorf("internal server error")
	}

	// Step 4: Get recurring breaks for the day of week
	dayOfWeek := int(date.Weekday())
	recurringBreaks, err := repository.GetEmployeeRecurringBreaksForDay(employeeID, dayOfWeek)
	if err != nil {
		utils.Error(fmt.Sprintf("Failed to get recurring breaks for employee %s on day %d: %v", employeeID, dayOfWeek, err))
		return nil, fmt.Errorf("internal server error")
	}

	// Step 5: Process and build the response
	response := s.buildAvailabilityResponse(employeeID, date, schedule, oneTimeBlocks, recurringBreaks)
	
	return response, nil
}

// buildAvailabilityResponse constructs the availability response with all necessary processing
func (s *AvailabilityService) buildAvailabilityResponse(
	employeeID uuid.UUID,
	date time.Time,
	schedule *model.Schedule,
	oneTimeBlocks []model.OnetimeBlock,
	recurringBreaks []model.RecurringBreak,
) *model.AvailabilityResponse {
	
	// Build schedule information with full datetime
	availabilitySchedule := s.buildScheduleInfo(date, schedule)
	
	// Process one-time blocks - trim to schedule hours and date boundaries
	processedBlocks := s.processOneTimeBlocks(date, schedule, oneTimeBlocks)
	
	// Process recurring breaks - convert to full datetime and trim to schedule hours
	processedBreaks := s.processRecurringBreaks(date, schedule, recurringBreaks)
	
	// Resolve conflicts between one-time blocks and breaks (one-time blocks take priority)
	finalBreaks := s.resolveBreakConflicts(processedBreaks, processedBlocks)
	
	// Ensure slices are never nil to avoid null in JSON response
	if processedBlocks == nil {
		processedBlocks = []model.AvailabilityBlock{}
	}
	if finalBreaks == nil {
		finalBreaks = []model.AvailabilityBreak{}
	}

	return &model.AvailabilityResponse{
		Date:          date,
		EmployeeID:    employeeID,
		Schedule:      availabilitySchedule,
		OneTimeBlocks: processedBlocks,
		Breaks:        finalBreaks,
	}
}

// buildScheduleInfo converts schedule to availability schedule with full datetime
func (s *AvailabilityService) buildScheduleInfo(date time.Time, schedule *model.Schedule) *model.AvailabilitySchedule {
	// Combine date with schedule times to create full datetime in UTC
	startDateTime := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.StartTime.Hour(), schedule.StartTime.Minute(), schedule.StartTime.Second(),
		0, time.UTC,
	)
	
	endDateTime := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.EndTime.Hour(), schedule.EndTime.Minute(), schedule.EndTime.Second(),
		0, time.UTC,
	)
	
	// Handle midnight crossing schedules (end time next day)
	if schedule.EndTime.Before(schedule.StartTime) {
		endDateTime = endDateTime.AddDate(0, 0, 1)
	}
	
	return &model.AvailabilitySchedule{
		StartTime: startDateTime,
		EndTime:   endDateTime,
	}
}

// processOneTimeBlocks handles one-time blocks with multi-day span logic
func (s *AvailabilityService) processOneTimeBlocks(
	date time.Time,
	schedule *model.Schedule,
	oneTimeBlocks []model.OnetimeBlock,
) []model.AvailabilityBlock {
	
	// Initialize as empty slice to ensure JSON returns [] instead of null
	processedBlocks := make([]model.AvailabilityBlock, 0)
	
	// Create schedule time range for the date in UTC
	scheduleStart := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.StartTime.Hour(), schedule.StartTime.Minute(), schedule.StartTime.Second(),
		0, time.UTC,
	)
	
	scheduleEnd := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.EndTime.Hour(), schedule.EndTime.Minute(), schedule.EndTime.Second(),
		0, time.UTC,
	)
	
	// Handle midnight crossing schedules
	if schedule.EndTime.Before(schedule.StartTime) {
		scheduleEnd = scheduleEnd.AddDate(0, 0, 1)
	}
	
	scheduleRange := model.TimeRange{Start: scheduleStart, End: scheduleEnd}
	
	for _, block := range oneTimeBlocks {
		// Create time range for the block, ensuring times are in UTC
		blockRange := model.TimeRange{Start: block.StartDateTime.UTC(), End: block.EndDateTime.UTC()}
		
		// Find intersection between block and schedule
		intersection := scheduleRange.GetIntersection(blockRange)
		if intersection != nil && intersection.IsValid() {
			processedBlocks = append(processedBlocks, model.AvailabilityBlock{
				StartTime: intersection.Start.UTC(),
				EndTime:   intersection.End.UTC(),
				Reason:    block.Reason,
			})
		}
	}
	
	return processedBlocks
}

// processRecurringBreaks converts recurring breaks to full datetime and trims to schedule
func (s *AvailabilityService) processRecurringBreaks(
	date time.Time,
	schedule *model.Schedule,
	recurringBreaks []model.RecurringBreak,
) []model.AvailabilityBreak {
	
	// Initialize as empty slice to ensure JSON returns [] instead of null
	processedBreaks := make([]model.AvailabilityBreak, 0)
	
	utils.Info(fmt.Sprintf("Processing %d recurring breaks", len(recurringBreaks)))
	
	// Create schedule time range for the date in UTC
	scheduleStart := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.StartTime.Hour(), schedule.StartTime.Minute(), schedule.StartTime.Second(),
		0, time.UTC,
	)
	
	scheduleEnd := time.Date(
		date.Year(), date.Month(), date.Day(),
		schedule.EndTime.Hour(), schedule.EndTime.Minute(), schedule.EndTime.Second(),
		0, time.UTC,
	)
	
	// Handle midnight crossing schedules
	if schedule.EndTime.Before(schedule.StartTime) {
		scheduleEnd = scheduleEnd.AddDate(0, 0, 1)
	}
	
	utils.Info(fmt.Sprintf("Schedule range: %s to %s", scheduleStart.Format(time.RFC3339), scheduleEnd.Format(time.RFC3339)))
	
	scheduleRange := model.TimeRange{Start: scheduleStart, End: scheduleEnd}
	
	for i, recBreak := range recurringBreaks {
		utils.Info(fmt.Sprintf("Processing break %d: ID=%s, Start=%s, End=%s", i, recBreak.ID, recBreak.StartTime.Format(time.RFC3339), recBreak.EndTime.Format(time.RFC3339)))
		
		// Validate break times before processing
		if recBreak.StartTime.IsZero() || recBreak.EndTime.IsZero() {
			utils.Error(fmt.Sprintf("Invalid break times for break ID %s", recBreak.ID))
			continue
		}
		
		// Convert break times to full datetime for the specific date in UTC
		breakStart := time.Date(
			date.Year(), date.Month(), date.Day(),
			recBreak.StartTime.Hour(), recBreak.StartTime.Minute(), recBreak.StartTime.Second(),
			0, time.UTC,
		)
		
		breakEnd := time.Date(
			date.Year(), date.Month(), date.Day(),
			recBreak.EndTime.Hour(), recBreak.EndTime.Minute(), recBreak.EndTime.Second(),
			0, time.UTC,
		)
		
		utils.Info(fmt.Sprintf("Converted break times: %s to %s", breakStart.Format(time.RFC3339), breakEnd.Format(time.RFC3339)))
		
		// Handle midnight crossing breaks
		if recBreak.EndTime.Before(recBreak.StartTime) {
			breakEnd = breakEnd.AddDate(0, 0, 1)
			utils.Info("Adjusted for midnight crossing break")
		}
		
		breakRange := model.TimeRange{Start: breakStart, End: breakEnd}
		utils.Info(fmt.Sprintf("Break range created: %s to %s", breakRange.Start.Format(time.RFC3339), breakRange.End.Format(time.RFC3339)))
		
		// Find intersection between break and schedule
		intersection := scheduleRange.GetIntersection(breakRange)
		if intersection != nil && intersection.IsValid() {
			utils.Info(fmt.Sprintf("Found intersection: %s to %s", intersection.Start.Format(time.RFC3339), intersection.End.Format(time.RFC3339)))
			processedBreaks = append(processedBreaks, model.AvailabilityBreak{
				StartTime: intersection.Start.UTC(),
				EndTime:   intersection.End.UTC(),
				Reason:    recBreak.Reason,
			})
		} else {
			utils.Info("No intersection found or invalid intersection")
		}
	}
	
	utils.Info(fmt.Sprintf("Processed %d breaks, returning %d valid breaks", len(recurringBreaks), len(processedBreaks)))
	return processedBreaks
}

// resolveBreakConflicts handles conflicts between breaks and one-time blocks
// One-time blocks take priority and will cause breaks to be trimmed or removed
func (s *AvailabilityService) resolveBreakConflicts(
	breaks []model.AvailabilityBreak,
	oneTimeBlocks []model.AvailabilityBlock,
) []model.AvailabilityBreak {
	
	// Initialize as empty slice to ensure JSON returns [] instead of null
	finalBreaks := make([]model.AvailabilityBreak, 0)
	
	for _, breakItem := range breaks {
		breakRange := model.TimeRange{Start: breakItem.StartTime, End: breakItem.EndTime}
		
		// Check for conflicts with all one-time blocks
		conflictingRanges := s.findConflictingRanges(breakRange, oneTimeBlocks)
		
		// If no conflicts, keep the break as is
		if len(conflictingRanges) == 0 {
			finalBreaks = append(finalBreaks, breakItem)
			continue
		}
		
		// Resolve conflicts by trimming or splitting the break
		resolvedBreaks := s.trimBreakAroundConflicts(breakItem, conflictingRanges)
		finalBreaks = append(finalBreaks, resolvedBreaks...)
	}
	
	return finalBreaks
}

// findConflictingRanges finds all one-time block ranges that conflict with a break
func (s *AvailabilityService) findConflictingRanges(
	breakRange model.TimeRange,
	oneTimeBlocks []model.AvailabilityBlock,
) []model.TimeRange {
	
	conflicts := make([]model.TimeRange, 0)
	
	for _, block := range oneTimeBlocks {
		blockRange := model.TimeRange{Start: block.StartTime, End: block.EndTime}
		if breakRange.HasOverlap(blockRange) {
			conflicts = append(conflicts, blockRange)
		}
	}
	
	return conflicts
}

// trimBreakAroundConflicts trims a break around conflicting one-time blocks
// May result in multiple break segments or complete removal
func (s *AvailabilityService) trimBreakAroundConflicts(
	originalBreak model.AvailabilityBreak,
	conflicts []model.TimeRange,
) []model.AvailabilityBreak {
	
	// Start with the original break range
	availableRanges := []model.TimeRange{{Start: originalBreak.StartTime, End: originalBreak.EndTime}}
	
	// For each conflict, trim all available ranges
	for _, conflict := range conflicts {
		var newRanges []model.TimeRange
		
		for _, availableRange := range availableRanges {
			trimmedRanges := s.trimRangeAroundConflict(availableRange, conflict)
			newRanges = append(newRanges, trimmedRanges...)
		}
		
		availableRanges = newRanges
	}
	
	// Convert remaining ranges back to breaks
	resultBreaks := make([]model.AvailabilityBreak, 0)
	for _, timeRange := range availableRanges {
		if timeRange.IsValid() {
			resultBreaks = append(resultBreaks, model.AvailabilityBreak{
				StartTime: timeRange.Start,
				EndTime:   timeRange.End,
				Reason:    originalBreak.Reason,
			})
		}
	}
	
	return resultBreaks
}

// trimRangeAroundConflict trims a single time range around a conflicting range
func (s *AvailabilityService) trimRangeAroundConflict(
	original model.TimeRange,
	conflict model.TimeRange,
) []model.TimeRange {
	
	// If no overlap, return original range
	if !original.HasOverlap(conflict) {
		return []model.TimeRange{original}
	}
	
	var result []model.TimeRange
	
	// Add the part before the conflict (if any)
	if original.Start.Before(conflict.Start) {
		beforeRange := model.TimeRange{Start: original.Start, End: conflict.Start}
		if beforeRange.IsValid() {
			result = append(result, beforeRange)
		}
	}
	
	// Add the part after the conflict (if any)
	if original.End.After(conflict.End) {
		afterRange := model.TimeRange{Start: conflict.End, End: original.End}
		if afterRange.IsValid() {
			result = append(result, afterRange)
		}
	}
	
	return result
} 