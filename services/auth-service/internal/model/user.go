package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email               string    `json:"email" gorm:"uniqueIndex;not null"`
	Username            string    `json:"username" gorm:"uniqueIndex;not null"`
	Password            string    `json:"-" gorm:"not null"` // "-" means this field won't appear in JSON
	Role                string    `json:"role" gorm:"not null;default:'user'"`
	CreatedAt           time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	IsVerified          bool      `json:"is_verified" gorm:"default:false"`
	VerificationToken   string    `json:"-" gorm:"index"`
	TokenExpiresAt      time.Time `json:"-"`
	ResetPasswordToken  string    `json:"-" gorm:"index"`
	ResetTokenExpiresAt time.Time `json:"-"`
	RefreshToken        string    `json:"-" gorm:"size:512"`
	RefreshExpiresAt    time.Time `json:"-"`
} 