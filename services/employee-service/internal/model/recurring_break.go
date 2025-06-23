package model

import (
	"time"

	"github.com/google/uuid"
)

// RecurringBreak represents a recurring break for an employee.
// reserched for having 7 daysofweek as 7 colunms but evidently chose not to do so.
type RecurringBreak struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	EmployeeID  uuid.UUID  `json:"employee_id" gorm:"type:uuid;not null;index"`
	DayOfWeek   int        `json:"day_of_week" gorm:"type:smallint;not null;check:day_of_week >= 0 AND day_of_week <= 6"` // 0-6 (Sun-Sat)
	StartTime   time.Time  `json:"start_time" gorm:"type:time without time zone;not null"`                                  // HH:MM:SS format
	EndTime     time.Time  `json:"end_time" gorm:"type:time without time zone;not null"`                                    // HH:MM:SS format
	Reason      string     `json:"reason" gorm:"type:text;not null"`                                                         // Mandatory reason for the break
	CreatedAt   time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
} 