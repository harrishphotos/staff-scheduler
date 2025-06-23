package model

import (
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID             uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SalonID        uuid.UUID     `json:"salonId" gorm:"type:uuid;not null;index"`
	CustomerID     *uuid.UUID    `json:"customerId" gorm:"type:uuid;index"`
	CustomerName   string        `json:"customerName" gorm:"type:varchar(100)"`
	CustomerNumber string        `json:"customerNumber" gorm:"type:varchar(15)"`
	BookingStatus  string        `json:"bookingStatus" gorm:"type:varchar(20);default:'pending';index"`
	StartTime      time.Time     `json:"startTime" gorm:"type:timestamp with time zone;not null;index"`
	EndTime        time.Time     `json:"endTime" gorm:"type:timestamp with time zone;not null"`
	TotalPrice     float64       `json:"totalPrice" gorm:"type:decimal(10,2)"`
	AdvancePayment float64       `json:"advancePayment" gorm:"type:decimal(10,2);default:0.00"`
	PaymentID      *uuid.UUID    `json:"paymentId" gorm:"type:uuid"`
	Notes          *string       `json:"notes,omitempty" gorm:"type:text"` // optional notes from frontend
	CreatedAt      time.Time     `json:"createdAt" gorm:"autoCreateTime;index"`
	UpdatedAt      time.Time     `json:"updatedAt" gorm:"autoUpdateTime"`
	BookingSlots   []BookingSlot `json:"bookingSlots" gorm:"foreignKey:BookingID;references:ID;constraint:OnDelete:CASCADE"`
}

type BookingSlot struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	BookingID  uuid.UUID `json:"bookingId" gorm:"type:uuid;not null;index"`
	StartTime  time.Time `json:"startTime" gorm:"type:timestamp with time zone;not null;index"`
	EndTime    time.Time `json:"endTime" gorm:"type:timestamp with time zone;not null"`
	StaffID    uuid.UUID `json:"staffId" gorm:"type:uuid;not null;index"`
	ServiceID  uuid.UUID `json:"serviceId" gorm:"type:uuid;not null;index"`
	IsPackaged bool      `json:"isPackaged" gorm:"default:false"`
}
