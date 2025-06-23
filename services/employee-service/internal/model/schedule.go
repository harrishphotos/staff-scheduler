package model

import (
	"time"

	"github.com/google/uuid"
)

// Schedule represents an employee's work schedule
type Schedule struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EmployeeID  uuid.UUID `json:"employee_id" gorm:"type:uuid;not null;index"`
	DayOfWeek   int       `json:"day_of_week" gorm:"type:smallint;not null;check:day_of_week >= 0 AND day_of_week <= 6"` // 0-6 (Sun-Sat)
	StartTime   time.Time `json:"start_time" gorm:"type:time without time zone;not null"`                                // HH:MM:SS format
	EndTime     time.Time `json:"end_time" gorm:"type:time without time zone;not null"`                                  // HH:MM:SS format
	ValidFrom   time.Time `json:"valid_from" gorm:"type:date;not null"`                                                   // Date from which schedule is valid
	ValidUntil  *time.Time `json:"valid_until" gorm:"type:date"`                                                          // Date until schedule is valid (nullable). If equal to ValidFrom, this is a one-time schedule, otherwise recurring.
	Notes       string    `json:"notes" gorm:"type:text"`                                                                 // Optional notes about the schedule
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
