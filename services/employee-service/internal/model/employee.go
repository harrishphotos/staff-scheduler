package model

import (
	"time"

	"github.com/google/uuid"
)

type Employee struct {
    ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    FirstName   string    `json:"first_name" gorm:"type:varchar(40);not null"`
    LastName    string    `json:"last_name" gorm:"type:varchar(40);not null"`
    Email       string    `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
    Picture     string    `json:"picture" gorm:"type:text"`
    Role        string    `json:"role" gorm:"type:varchar(100)"`
    IsActive    bool      `json:"is_active" gorm:"default:false"`
    CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}