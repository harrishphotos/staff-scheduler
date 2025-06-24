package repository

import (
	"time"

	"services/shared/db"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// GetEmployeeScheduleForDate finds the applicable schedule for an employee on a specific date
// Returns the most relevant schedule based on the business logic:
// 1. Must match the day of week
// 2. Must be within valid date range (valid_from <= date <= valid_until)
// 3. If multiple schedules match, returns the one with valid_from closest to (but not after) the target date
func GetEmployeeScheduleForDate(employeeID uuid.UUID, date time.Time) (*model.Schedule, error) {
	dayOfWeek := int(date.Weekday())
	
	// Create DTO to handle time string conversion from database
	type ScheduleDTO struct {
		ID          uuid.UUID  `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID  `gorm:"type:uuid;not null"`
		DayOfWeek   int        `gorm:"type:smallint;not null"`
		StartTime   string     `gorm:"type:time without time zone;not null"`
		EndTime     string     `gorm:"type:time without time zone;not null"`
		ValidFrom   time.Time  `gorm:"type:date;not null"`
		ValidUntil  *time.Time `gorm:"type:date"`
		Notes       string     `gorm:"type:text"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	var scheduleDTOs []ScheduleDTO
	
	// Query for schedules that are valid on the specified date
	// A schedule is valid if:
	// 1. It matches the employee ID
	// 2. It matches the day of week
	// 3. The date is on or after valid_from
	// 4. The date is on or before valid_until (if valid_until is set)
	err := db.DB.Model(&model.Schedule{}).Select("*").
		Where("employee_id = ? AND day_of_week = ? AND valid_from <= ? AND (valid_until IS NULL OR valid_until >= ?)",
			employeeID, dayOfWeek, date, date).
		Order("valid_from DESC"). // Order by valid_from descending to get the most recent one first
		Find(&scheduleDTOs).Error
	
	if err != nil {
		return nil, err
	}

	// If no schedules found, return nil
	if len(scheduleDTOs) == 0 {
		return nil, nil
	}

	// If multiple schedules found, select the one with valid_from closest to (but not after) the target date
	// Since we ordered by valid_from DESC, the first one is the most recent valid_from that's <= target date
	selectedDTO := scheduleDTOs[0]

	// Convert DTO to model.Schedule object
	startTime, err := time.Parse("15:04:05", selectedDTO.StartTime)
	if err != nil {
		return nil, err
	}
	
	endTime, err := time.Parse("15:04:05", selectedDTO.EndTime)
	if err != nil {
		return nil, err
	}
	
	schedule := &model.Schedule{
		ID:         selectedDTO.ID,
		EmployeeID: selectedDTO.EmployeeID,
		DayOfWeek:  selectedDTO.DayOfWeek,
		StartTime:  startTime,
		EndTime:    endTime,
		ValidFrom:  selectedDTO.ValidFrom,
		ValidUntil: selectedDTO.ValidUntil,
		Notes:      selectedDTO.Notes,
		CreatedAt:  selectedDTO.CreatedAt,
		UpdatedAt:  selectedDTO.UpdatedAt,
	}
	
	return schedule, nil
}

// GetEmployeeOneTimeBlocksForDate finds all one-time blocks that overlap with the specified date
// This includes blocks that:
// 1. Start before the date and end during/after the date
// 2. Start during the date
// 3. Start after the date but before the end of the date
func GetEmployeeOneTimeBlocksForDate(employeeID uuid.UUID, date time.Time) ([]model.OnetimeBlock, error) {
	var blocks []model.OnetimeBlock
	
	// Calculate the start and end of the target date
	startOfDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDate := time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 999999999, date.Location())
	
	// Query for one-time blocks that overlap with the specified date
	// A block overlaps if:
	// 1. Block starts before end of date AND block ends after start of date
	err := db.DB.Where("employee_id = ? AND start_date_time < ? AND end_date_time > ?",
		employeeID, endOfDate, startOfDate).
		Find(&blocks).Error
	
	return blocks, err
}

// GetEmployeeRecurringBreaksForDay finds all recurring breaks for an employee on a specific day of week
func GetEmployeeRecurringBreaksForDay(employeeID uuid.UUID, dayOfWeek int) ([]model.RecurringBreak, error) {
	// Create DTO to handle time string conversion from database
	type RecurringBreakDTO struct {
		ID          uuid.UUID  `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID  `gorm:"type:uuid;not null"`
		DayOfWeek   int        `gorm:"type:smallint;not null"`
		StartTime   string     `gorm:"type:time without time zone;not null"`
		EndTime     string     `gorm:"type:time without time zone;not null"`
		Reason      string     `gorm:"type:text;not null"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	var breakDTOs []RecurringBreakDTO
	
	// Query for recurring breaks that match the employee and day of week
	err := db.DB.Model(&model.RecurringBreak{}).Select("*").
		Where("employee_id = ? AND day_of_week = ?", employeeID, dayOfWeek).
		Find(&breakDTOs).Error
	
	if err != nil {
		return nil, err
	}

	// Convert DTOs to model.RecurringBreak objects
	breaks := make([]model.RecurringBreak, len(breakDTOs))
	for i, dto := range breakDTOs {
		startTime, err := time.Parse("15:04:05", dto.StartTime)
		if err != nil {
			return nil, err
		}
		
		endTime, err := time.Parse("15:04:05", dto.EndTime)
		if err != nil {
			return nil, err
		}
		
		breaks[i] = model.RecurringBreak{
			ID:         dto.ID,
			EmployeeID: dto.EmployeeID,
			DayOfWeek:  dto.DayOfWeek,
			StartTime:  startTime,
			EndTime:    endTime,
			Reason:     dto.Reason,
			CreatedAt:  dto.CreatedAt,
			UpdatedAt:  dto.UpdatedAt,
		}
	}
	
	return breaks, nil
}

// CheckEmployeeExists verifies if an employee exists in the database
func CheckEmployeeExists(employeeID uuid.UUID) (bool, error) {
	var count int64
	err := db.DB.Model(&model.Employee{}).Where("id = ?", employeeID).Count(&count).Error
	return count > 0, err
} 