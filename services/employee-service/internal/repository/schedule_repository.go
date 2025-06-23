package repository

import (
	"time"

	"services/shared/db"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// CreateSchedule creates a new schedule in the database
func CreateSchedule(schedule *model.Schedule) error {
	// Generate a UUID if one isn't provided
	if schedule.ID == uuid.Nil {
		schedule.ID = uuid.New()
	}
	return db.DB.Create(schedule).Error
}

// CheckDuplicateSchedule checks if there's already a schedule for the same employee
// on the same day of week with exactly the same date range
func CheckDuplicateSchedule(employeeID uuid.UUID, dayOfWeek int, validFrom time.Time, validUntil *time.Time, excludeID *uuid.UUID) (bool, error) {
	query := db.DB.Model(&model.Schedule{}).Where("employee_id = ? AND day_of_week = ? AND valid_from = ?", 
		employeeID, dayOfWeek, validFrom)
	
	// Handle validUntil based on whether it's null or not
	if validUntil == nil {
		query = query.Where("valid_until IS NULL")
	} else {
		query = query.Where("valid_until = ?", *validUntil)
	}
	
	// Exclude the current schedule if updating
	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}
	
	var count int64
	err := query.Count(&count).Error
	return count > 0, err
}

// GetScheduleByID returns a schedule by ID
func GetScheduleByID(id uuid.UUID) (model.Schedule, error) {
	// Create DTO to handle time string conversion
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

	var scheduleDTO ScheduleDTO
	err := db.DB.Model(&model.Schedule{}).Select("*").Where("id = ?", id).First(&scheduleDTO).Error
	if err != nil {
		return model.Schedule{}, err
	}

	// Convert DTO to model.Schedule object
	startTime, _ := time.Parse("15:04:05", scheduleDTO.StartTime)
	endTime, _ := time.Parse("15:04:05", scheduleDTO.EndTime)
	
	schedule := model.Schedule{
		ID:         scheduleDTO.ID,
		EmployeeID: scheduleDTO.EmployeeID,
		DayOfWeek:  scheduleDTO.DayOfWeek,
		StartTime:  startTime,
		EndTime:    endTime,
		ValidFrom:  scheduleDTO.ValidFrom,
		ValidUntil: scheduleDTO.ValidUntil,
		Notes:      scheduleDTO.Notes,
		CreatedAt:  scheduleDTO.CreatedAt,
		UpdatedAt:  scheduleDTO.UpdatedAt,
	}
	
	return schedule, nil
}

// GetEmployeeSchedules returns all schedules for a specific employee
func GetEmployeeSchedules(employeeID uuid.UUID) ([]model.Schedule, error) {
	var schedules []model.Schedule
	err := db.DB.Where("employee_id = ?", employeeID).Find(&schedules).Error
	return schedules, err
}

// GetEmployeeSchedulesForDate returns schedules applicable for a specific date
func GetEmployeeSchedulesForDate(employeeID uuid.UUID, date time.Time) ([]model.Schedule, error) {
	dayOfWeek := int(date.Weekday())
	
	// Create DTO to handle time string conversion
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
	// 1. It matches the day of week
	// 2. The date is on or after validFrom
	// 3. The date is on or before validUntil (if validUntil is set)
	err := db.DB.Model(&model.Schedule{}).Select("*").Where("employee_id = ? AND day_of_week = ? AND valid_from <= ? AND (valid_until IS NULL OR valid_until >= ?)",
		employeeID, dayOfWeek, date, date).Find(&scheduleDTOs).Error
	
	if err != nil {
		return nil, err
	}

	// Convert DTOs to model.Schedule objects
	schedules := make([]model.Schedule, len(scheduleDTOs))
	for i, dto := range scheduleDTOs {
		startTime, _ := time.Parse("15:04:05", dto.StartTime)
		endTime, _ := time.Parse("15:04:05", dto.EndTime)
		
		schedules[i] = model.Schedule{
			ID:         dto.ID,
			EmployeeID: dto.EmployeeID,
			DayOfWeek:  dto.DayOfWeek,
			StartTime:  startTime,
			EndTime:    endTime,
			ValidFrom:  dto.ValidFrom,
			ValidUntil: dto.ValidUntil,
			Notes:      dto.Notes,
			CreatedAt:  dto.CreatedAt,
			UpdatedAt:  dto.UpdatedAt,
		}
	}
	
	return schedules, nil
}

// GetActiveSchedules returns all active schedules (current and future)
func GetActiveSchedules() ([]model.Schedule, error) {
	today := time.Now().Format("2006-01-02")
	var schedules []model.Schedule
	
	err := db.DB.Where("(valid_until IS NULL OR valid_until >= ?)", today).Find(&schedules).Error
	return schedules, err
}

// GetFilteredSchedules returns schedules based on filter criteria
// If employeeID is provided, filters by employee
// If dayOfWeek is provided, filters by day of week
// If includeExpired is false, excludes schedules where validUntil is in the past
func GetFilteredSchedules(employeeID *uuid.UUID, dayOfWeek *int, includeExpired bool) ([]model.Schedule, error) {
	// Create a custom DTO struct to handle the string time formats
	// the problem is that db returns the string time but we need to return the time.Time
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
	query := db.DB.Model(&model.Schedule{}).Select("*")
	
	// Filter by employee ID if provided
	if employeeID != nil {
		query = query.Where("employee_id = ?", *employeeID)
	}
	
	// Filter by day of week if provided
	if dayOfWeek != nil {
		query = query.Where("day_of_week = ?", *dayOfWeek)
	}
	
	// Filter out expired schedules unless includeExpired is true
	if !includeExpired {
		today := time.Now().Format("2006-01-02")
		query = query.Where("(valid_until IS NULL OR valid_until >= ?)", today)
	}
	
	// Execute query and scan into DTOs
	if err := query.Find(&scheduleDTOs).Error; err != nil {
		return nil, err
	}
	
	// Convert DTOs to model.Schedule objects
	schedules := make([]model.Schedule, len(scheduleDTOs))
	for i, dto := range scheduleDTOs {
		startTime, _ := time.Parse("15:04:05", dto.StartTime)
		endTime, _ := time.Parse("15:04:05", dto.EndTime)
		
		schedules[i] = model.Schedule{
			ID:         dto.ID,
			EmployeeID: dto.EmployeeID,
			DayOfWeek:  dto.DayOfWeek,
			StartTime:  startTime,
			EndTime:    endTime,
			ValidFrom:  dto.ValidFrom,
			ValidUntil: dto.ValidUntil,
			Notes:      dto.Notes,
			CreatedAt:  dto.CreatedAt,
			UpdatedAt:  dto.UpdatedAt,
		}
	}
	
	return schedules, nil
}

// UpdateSchedule updates a schedule in the database
func UpdateSchedule(schedule *model.Schedule) error {
	return db.DB.Save(schedule).Error
}

// DeleteSchedule deletes a schedule
func DeleteSchedule(id uuid.UUID) error {
	return db.DB.Delete(&model.Schedule{}, id).Error
} 