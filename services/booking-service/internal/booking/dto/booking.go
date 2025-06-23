package dto

type Service struct {
	ServiceID string `json:"serviceId"`
	Start     string `json:"start"`
	End       string `json:"end"`
	Staff     string `json:"staff"`
}

type Booking struct {
	ID             string    `json:"id"`
	Customer       string    `json:"customer"`
	Phone          string    `json:"phone,omitempty"`
	Note           string    `json:"note,omitempty"`
	ProfilePic     string    `json:"profilePic,omitempty"`
	Services       []Service `json:"services"`
	Start          string    `json:"start"`
	End            string    `json:"end"`
	TotalPrice     float64   `json:"totalPrice"`
	AdvancePayment float64   `json:"advancePayment,omitempty"`
	BookingStatus  string    `json:"bookingStatus,omitempty"`
	Date           string    `json:"date,omitempty"`
}
