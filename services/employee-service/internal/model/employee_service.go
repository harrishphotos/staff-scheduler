package model

import (
	"time"

	"github.com/google/uuid"
)

type EmployeeService struct {
    ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    EmployeeID  uuid.UUID `json:"employee_id" gorm:"type:uuid;not null;uniqueIndex:idx_employee_service"`
    ServiceID   uuid.UUID `json:"service_id" gorm:"type:uuid;not null;uniqueIndex:idx_employee_service"`
    CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// Add composite unique index to prevent duplicate associations
func (EmployeeService) TableName() string {
	return "employee_services"
} 