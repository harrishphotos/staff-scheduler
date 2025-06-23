package model

import (
	"time"

	"github.com/google/uuid"
)

// OnetimeBlock represents a specific, non-recurring block of time
// when an employee is unavailable. This can span multiple days (e.g., for leave).
type OnetimeBlock struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EmployeeID    uuid.UUID `json:"employee_id" gorm:"type:uuid;not null;index"`
	StartDateTime time.Time `json:"start_date_time" gorm:"type:timestamp with time zone;not null"` // Start date and time of the block
	EndDateTime   time.Time `json:"end_date_time" gorm:"type:timestamp with time zone;not null"`     // End date and time of the block
	Reason        string    `json:"reason" gorm:"type:text;not null"`                                // Mandatory reason for the block
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
} 