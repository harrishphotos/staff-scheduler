package repository

import (
	"services/shared/db"
	"time"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// CreateRecurringBreak creates a new recurring break in the database.
func CreateRecurringBreak(recurringBreak *model.RecurringBreak) error {
	if recurringBreak.ID == uuid.Nil {
		recurringBreak.ID = uuid.New()
	}
	return db.DB.Create(recurringBreak).Error
}

// CheckDuplicateRecurringBreak checks if a recurring break with the same employee ID,
// day of week, and reason already exists.
func CheckDuplicateRecurringBreak(
	employeeID uuid.UUID,
	dayOfWeek int,
	reason string,
	excludeID *uuid.UUID, // To exclude the current break if updating
) (bool, error) {
	query := db.DB.Model(&model.RecurringBreak{}).Where(
		"employee_id = ? AND day_of_week = ? AND reason = ?",
		employeeID, dayOfWeek, reason,
	)

	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}

	var count int64
	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CheckOverlappingRecurringBreak checks if a recurring break overlaps with an existing one
// for the same employee on the same day of week by comparing time ranges.
func CheckOverlappingRecurringBreak(
	employeeID uuid.UUID,
	dayOfWeek int,
	startTime time.Time,
	endTime time.Time,
	excludeID *uuid.UUID,
) (bool, error) {
	// Create DTO to handle time string conversion
	type RecurringBreakDTO struct {
		ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID `gorm:"type:uuid;not null"`
		DayOfWeek   int       `gorm:"type:smallint;not null"`
		StartTime   string    `gorm:"type:time without time zone;not null"`
		EndTime     string    `gorm:"type:time without time zone;not null"`
		Reason      string    `gorm:"type:text;not null"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	var existingBreakDTOs []RecurringBreakDTO
	query := db.DB.Model(&model.RecurringBreak{}).Select("*").
		Where("employee_id = ? AND day_of_week = ?", employeeID, dayOfWeek)

	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}

	if err := query.Find(&existingBreakDTOs).Error; err != nil {
		return false, err
	}

	// Convert DTOs to check for overlaps
	for _, dto := range existingBreakDTOs {
		existingStartTime, _ := time.Parse("15:04:05", dto.StartTime)
		existingEndTime, _ := time.Parse("15:04:05", dto.EndTime)
		
		// Check for time overlap:
		// (existingStartTime < endTime AND existingEndTime > startTime)
		if existingStartTime.Before(endTime) && existingEndTime.After(startTime) {
			return true, nil // Found an overlap
		}
	}
	return false, nil
}

// GetRecurringBreakByID returns a recurring break by ID
func GetRecurringBreakByID(id uuid.UUID) (model.RecurringBreak, error) {
	// Create DTO to handle time string conversion
	type RecurringBreakDTO struct {
		ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID `gorm:"type:uuid;not null"`
		DayOfWeek   int       `gorm:"type:smallint;not null"`
		StartTime   string    `gorm:"type:time without time zone;not null"`
		EndTime     string    `gorm:"type:time without time zone;not null"`
		Reason      string    `gorm:"type:text;not null"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	var recurringBreakDTO RecurringBreakDTO
	err := db.DB.Model(&model.RecurringBreak{}).Select("*").Where("id = ?", id).First(&recurringBreakDTO).Error
	if err != nil {
		return model.RecurringBreak{}, err
	}

	// Convert DTO to model.RecurringBreak object
	startTime, _ := time.Parse("15:04:05", recurringBreakDTO.StartTime)
	endTime, _ := time.Parse("15:04:05", recurringBreakDTO.EndTime)
	
	recurringBreak := model.RecurringBreak{
		ID:         recurringBreakDTO.ID,
		EmployeeID: recurringBreakDTO.EmployeeID,
		DayOfWeek:  recurringBreakDTO.DayOfWeek,
		StartTime:  startTime,
		EndTime:    endTime,
		Reason:     recurringBreakDTO.Reason,
		CreatedAt:  recurringBreakDTO.CreatedAt,
		UpdatedAt:  recurringBreakDTO.UpdatedAt,
	}
	
	return recurringBreak, nil
}

// GetEmployeeRecurringBreaks returns all recurring breaks for a specific employee
func GetEmployeeRecurringBreaks(employeeID uuid.UUID) ([]model.RecurringBreak, error) {
	// Create DTO to handle time string conversion
	type RecurringBreakDTO struct {
		ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID `gorm:"type:uuid;not null"`
		DayOfWeek   int       `gorm:"type:smallint;not null"`
		StartTime   string    `gorm:"type:time without time zone;not null"`
		EndTime     string    `gorm:"type:time without time zone;not null"`
		Reason      string    `gorm:"type:text;not null"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	var recurringBreakDTOs []RecurringBreakDTO
	err := db.DB.Model(&model.RecurringBreak{}).Select("*").Where("employee_id = ?", employeeID).Find(&recurringBreakDTOs).Error
	if err != nil {
		return nil, err
	}

	// Convert DTOs to model.RecurringBreak objects
	recurringBreaks := make([]model.RecurringBreak, len(recurringBreakDTOs))
	for i, dto := range recurringBreakDTOs {
		startTime, _ := time.Parse("15:04:05", dto.StartTime)
		endTime, _ := time.Parse("15:04:05", dto.EndTime)
		
		recurringBreaks[i] = model.RecurringBreak{
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

	return recurringBreaks, nil
}

// GetFilteredRecurringBreaks returns recurring breaks based on filter criteria
// If employeeID is provided, filters by employee
// If dayOfWeek is provided, filters by day of week
func GetFilteredRecurringBreaks(employeeID *uuid.UUID, dayOfWeek *int) ([]model.RecurringBreak, error) {
	// Create a custom DTO struct to handle the string time formats
	// The issue is that the database returns time values as strings, not as time.Time objects
	type RecurringBreakDTO struct {
		ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
		EmployeeID  uuid.UUID `gorm:"type:uuid;not null"`
		DayOfWeek   int       `gorm:"type:smallint;not null"`
		StartTime   string    `gorm:"type:time without time zone;not null"` // String format from DB
		EndTime     string    `gorm:"type:time without time zone;not null"` // String format from DB
		Reason      string    `gorm:"type:text;not null"`
		CreatedAt   time.Time
		UpdatedAt   time.Time
	}

	query := db.DB.Model(&model.RecurringBreak{}).Select("*")
	
	// Filter by employee ID if provided
	if employeeID != nil {
		query = query.Where("employee_id = ?", *employeeID)
	}
	
	// Filter by day of week if provided
	if dayOfWeek != nil {
		query = query.Where("day_of_week = ?", *dayOfWeek)
	}
	
	// Execute query and scan into DTOs
	var recurringBreakDTOs []RecurringBreakDTO
	if err := query.Find(&recurringBreakDTOs).Error; err != nil {
		return nil, err
	}
	
	// Convert DTOs to model.RecurringBreak objects
	recurringBreaks := make([]model.RecurringBreak, len(recurringBreakDTOs))
	for i, dto := range recurringBreakDTOs {
		startTime, _ := time.Parse("15:04:05", dto.StartTime)
		endTime, _ := time.Parse("15:04:05", dto.EndTime)
		
		recurringBreaks[i] = model.RecurringBreak{
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
	
	return recurringBreaks, nil
}

// UpdateRecurringBreak updates a recurring break in the database
func UpdateRecurringBreak(recurringBreak *model.RecurringBreak) error {
	return db.DB.Save(recurringBreak).Error
}

// DeleteRecurringBreak deletes a recurring break
func DeleteRecurringBreak(id uuid.UUID) error {
	return db.DB.Delete(&model.RecurringBreak{}, id).Error
} 