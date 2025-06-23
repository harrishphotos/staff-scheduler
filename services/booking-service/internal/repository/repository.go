package repository

import (
	"services/booking-service/internal/model"
	"services/shared/db"
	"time"

	"github.com/google/uuid"
)

func CreateBooking(booking *model.Booking) error {
	// Generate a UUID if one isn't provided
	if booking.ID == uuid.Nil {
		booking.ID = uuid.New()
	}

	// Ensure BookingSlots have the correct BookingID
	for i := range booking.BookingSlots {
		booking.BookingSlots[i].BookingID = booking.ID
	}

	// Save the booking and its associated slots
	return db.DB.Create(booking).Error
}

func GetAllBookings() ([]model.Booking, error) {
	var bookings []model.Booking
	err := db.DB.Preload("BookingSlots").Find(&bookings).Error
	return bookings, err
}

func GetSalonBookingsBetween(salonID uuid.UUID, start, end time.Time) ([]model.Booking, error) {
	var bookings []model.Booking
	err := db.DB.Preload("BookingSlots").
		Where("salon_id = ? AND start_time >= ? AND start_time < ?", salonID, start, end).
		Find(&bookings).Error
	return bookings, err
}

// GetEmployeeBookingSlotsForDate gets all booking slots for a specific employee on a specific date
func GetEmployeeBookingSlotsForDate(employeeID uuid.UUID, date time.Time) ([]model.BookingSlot, error) {
	var bookingSlots []model.BookingSlot
	
	// Get start and end of the day
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 999999999, date.Location())
	
	err := db.DB.Where("staff_id = ? AND start_time >= ? AND start_time <= ?", 
		employeeID, startOfDay, endOfDay).Find(&bookingSlots).Error
	
	return bookingSlots, err
}

// GetOverlappingBookingSlots gets booking slots that overlap with a given time range for an employee
func GetOverlappingBookingSlots(employeeID uuid.UUID, startTime, endTime time.Time) ([]model.BookingSlot, error) {
	var bookingSlots []model.BookingSlot
	
	// Find slots where:
	// (slot.start_time < endTime) AND (slot.end_time > startTime)
	// This is the standard condition for detecting time range overlaps
	err := db.DB.Where("staff_id = ? AND start_time < ? AND end_time > ?", 
		employeeID, endTime, startTime).Find(&bookingSlots).Error
	
	return bookingSlots, err
}

// GetServingBookingsAtTime gets all bookings with status "serving" that overlap with the given time
func GetServingBookingsAtTime(currentTime time.Time) ([]model.Booking, error) {
	var bookings []model.Booking
	
	// Find bookings where:
	// 1. booking_status = "serving"
	// 2. start_time <= current_time <= end_time
	err := db.DB.Preload("BookingSlots").
		Where("booking_status = ? AND start_time <= ? AND end_time > ?", 
			"serving", currentTime, currentTime).
		Find(&bookings).Error
	
	return bookings, err
}

// GetBookingSlotsOverlappingTime gets booking slots from given bookings that overlap with current time
func GetBookingSlotsOverlappingTime(bookingIDs []uuid.UUID, currentTime time.Time) ([]model.BookingSlot, error) {
	var bookingSlots []model.BookingSlot
	
	if len(bookingIDs) == 0 {
		return bookingSlots, nil
	}
	
	// Find slots where:
	// 1. booking_id is in the provided list
	// 2. start_time <= current_time < end_time
	err := db.DB.Where("booking_id IN ? AND start_time <= ? AND end_time > ?", 
		bookingIDs, currentTime, currentTime).Find(&bookingSlots).Error
	
	return bookingSlots, err
}
