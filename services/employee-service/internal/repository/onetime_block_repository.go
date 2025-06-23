package repository

import (
	"services/shared/db"
	"time"

	"github.com/google/uuid"
	"github.com/salobook/services/employee-service/internal/model"
)

// CreateOnetimeBlock creates a new one-time block in the database.
func CreateOnetimeBlock(onetimeBlock *model.OnetimeBlock) error {
	if onetimeBlock.ID == uuid.Nil {
		onetimeBlock.ID = uuid.New()
	}
	return db.DB.Create(onetimeBlock).Error
}

// CheckOverlappingOnetimeBlock checks if a one-time block overlaps with an existing one
// for the same employee by comparing date-time ranges.
func CheckOverlappingOnetimeBlock(
	employeeID uuid.UUID,
	startDateTime time.Time,
	endDateTime time.Time,
	excludeID *uuid.UUID,
) (bool, error) {
	query := db.DB.Model(&model.OnetimeBlock{}).
		Where("employee_id = ?", employeeID)

	if excludeID != nil {
		query = query.Where("id != ?", *excludeID)
	}

	// Find blocks where:
	// (existing.start_date_time < new.end_date_time) AND (existing.end_date_time > new.start_date_time)
	// This is the standard condition for detecting time range overlaps
	query = query.Where("start_date_time < ? AND end_date_time > ?", 
		endDateTime, startDateTime)

	var count int64
	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

// GetOnetimeBlockByID returns a one-time block by ID
func GetOnetimeBlockByID(id uuid.UUID) (model.OnetimeBlock, error) {
	var onetimeBlock model.OnetimeBlock
	err := db.DB.Where("id = ?", id).First(&onetimeBlock).Error
	return onetimeBlock, err
}

// GetEmployeeOnetimeBlocks returns all one-time blocks for a specific employee
func GetEmployeeOnetimeBlocks(employeeID uuid.UUID) ([]model.OnetimeBlock, error) {
	var onetimeBlocks []model.OnetimeBlock
	err := db.DB.Where("employee_id = ?", employeeID).Find(&onetimeBlocks).Error
	return onetimeBlocks, err
}

// GetFilteredOnetimeBlocks returns one-time blocks based on filter criteria
// If employeeID is provided, filters by employee
// If startDate and endDate are provided, returns blocks that fall within that period
func GetFilteredOnetimeBlocks(employeeID *uuid.UUID, startDate *time.Time, endDate *time.Time) ([]model.OnetimeBlock, error) {
	// Create DTO to handle potential time conversion issues
	type OnetimeBlockDTO struct {
		ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
		EmployeeID    uuid.UUID `gorm:"type:uuid;not null"`
		StartDateTime time.Time `gorm:"type:timestamp with time zone;not null"`
		EndDateTime   time.Time `gorm:"type:timestamp with time zone;not null"`
		Reason        string    `gorm:"type:text;not null"`
		CreatedAt     time.Time
		UpdatedAt     time.Time
	}

	query := db.DB.Model(&model.OnetimeBlock{}).Select("*")
	
	// Filter by employee ID if provided
	if employeeID != nil {
		query = query.Where("employee_id = ?", *employeeID)
	}
	
	// Filter by date range if both start and end are provided
	if startDate != nil && endDate != nil {
		// Return blocks that overlap with the requested period
		// (block.start <= period.end) AND (block.end >= period.start)
		query = query.Where("start_date_time <= ? AND end_date_time >= ?", 
			endDate, startDate)
	} else if startDate != nil {
		// Only filter by start date (blocks that end on or after the start date)
		query = query.Where("end_date_time >= ?", startDate)
	} else if endDate != nil {
		// Only filter by end date (blocks that start on or before the end date)
		query = query.Where("start_date_time <= ?", endDate)
	}
	
	// Execute query and scan into DTOs
	var onetimeBlockDTOs []OnetimeBlockDTO
	if err := query.Find(&onetimeBlockDTOs).Error; err != nil {
		return nil, err
	}
	
	// Convert DTOs to model objects (though type conversion may not be needed in this case)
	onetimeBlocks := make([]model.OnetimeBlock, len(onetimeBlockDTOs))
	for i, dto := range onetimeBlockDTOs {
		onetimeBlocks[i] = model.OnetimeBlock{
			ID:            dto.ID,
			EmployeeID:    dto.EmployeeID,
			StartDateTime: dto.StartDateTime,
			EndDateTime:   dto.EndDateTime,
			Reason:        dto.Reason,
			CreatedAt:     dto.CreatedAt,
			UpdatedAt:     dto.UpdatedAt,
		}
	}
	
	return onetimeBlocks, nil
}

// UpdateOnetimeBlock updates a one-time block in the database
func UpdateOnetimeBlock(onetimeBlock *model.OnetimeBlock) error {
	return db.DB.Save(onetimeBlock).Error
}

// DeleteOnetimeBlock deletes a one-time block
func DeleteOnetimeBlock(id uuid.UUID) error {
	return db.DB.Delete(&model.OnetimeBlock{}, id).Error
} 