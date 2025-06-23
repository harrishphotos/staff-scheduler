package booking

import (
	"services/booking-service/internal/booking/dto"
	"services/booking-service/internal/repository"
	"time"

	"github.com/google/uuid"
)

func GetSalonBookingsBetween(salonID uuid.UUID, startDate, endDate time.Time) ([]dto.Booking, error) {
	bookings, err := repository.GetSalonBookingsBetween(salonID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var result []dto.Booking
	for _, b := range bookings {
		var services []dto.Service
		for _, slot := range b.BookingSlots {
			services = append(services, dto.Service{
				ServiceID: slot.ServiceID.String(), // Optionally add name if you preload service info
				Start:     slot.StartTime.Format(time.RFC3339),
				End:       slot.EndTime.Format(time.RFC3339),
				Staff:     slot.StaffID.String(),
			})
		}

		result = append(result, dto.Booking{
			ID:             b.ID.String(),
			Customer:       b.CustomerName,
			Phone:          b.CustomerNumber,
			Services:       services,
			Start:          b.StartTime.Format(time.RFC3339),
			End:            b.EndTime.Format(time.RFC3339),
			TotalPrice:     b.TotalPrice,
			AdvancePayment: b.AdvancePayment,
			BookingStatus:  b.BookingStatus,
			Date:           b.StartTime.Format("2006-01-02"), // yyyy-mm-dd
		})
	}

	return result, nil
}
