package model

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
    CategoryID   uuid.UUID `json:"category_id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    CategoryName string    `json:"category_name" gorm:"type:varchar(100);not null"`

    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type Service struct {
    ServiceID   uuid.UUID `json:"service_id" gorm:"type:uuid;not null;primaryKey;default:gen_random_uuid()"`
    ServiceName string    `json:"service_name" gorm:"type:varchar(100);not null"`
    Duration    int       `json:"duration" gorm:"not null"`
    Price       float64   `json:"price" gorm:"type:decimal(10,2);not null"`
    Status      string    `json:"status" gorm:"type:varchar(20);default:'active'"`
    SalonID     uuid.UUID `json:"salon_id" gorm:"type:uuid;not null;index"`
    Gender      string    `json:"gender" gorm:"type:varchar(10);not null"`

    Categories []Category `json:"categories" gorm:"many2many:service_categories;constraint:OnDelete:CASCADE"`

    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type Package struct {
    PackageID       uuid.UUID   `json:"package_id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    PackageName     string      `json:"package_name" gorm:"type:varchar(100);not null"`
    PackagePrice    float64     `json:"package_price" gorm:"type:decimal(10,2);not null"`
    PackageDuration int         `json:"package_duration" gorm:"not null"`
    PackageStatus   string      `json:"package_status" gorm:"type:varchar(20);default:'active'"`
    PackageSalonID  uuid.UUID   `json:"package_salon_id" gorm:"type:uuid;not null;index"`
    Gender          string      `json:"gender" gorm:"type:varchar(10);not null"`

    Services        []Service   `json:"services" gorm:"many2many:package_services;constraint:OnDelete:CASCADE"`
    Categories      []Category  `json:"categories" gorm:"many2many:package_categories;constraint:OnDelete:CASCADE"`

    CreatedAt       time.Time   `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt       time.Time   `json:"updated_at" gorm:"autoUpdateTime"`
}