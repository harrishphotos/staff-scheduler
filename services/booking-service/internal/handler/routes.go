package handler

import (
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Post("/createAppointment/:salonId", CreateBookingHandler)
	app.Get("/getBookings", GetBookingsRangeHandler)
	app.Post("/availability", AvailabilityHandler)
	app.Get("/status", StatusHandler)
}
