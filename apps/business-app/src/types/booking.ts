import { Service } from "./service";

export type Booking = {
  id: string;
  customer: string;
  phone?: string;
  note?: string;
  profilePic?: string;
  services: Service[];
  start: string;
  end: string;
  paymentId?: string; // Payment transaction ID
  totalPrice: number;
  advancePayment?: number;
  bookingStatus: string; // e.g., "booked", "cancelled", "completed"
  date?: string;
};
/**
 * Represents a booking slot in the appointment form.
 * Each slot corresponds to a service selected for the appointment.
 */
export type BookingSlot = {
  startTime: string; // ISO string representing the start time of the service
  endTime: string; // ISO string representing the end time of the service
  staffId: string; // ID of the employee assigned to the service
  serviceId: string; // ID of the service being booked
  isPackaged: boolean; // Indicates whether the service is part of a package
};

export type BookingForm = {
  customerId?: string; // Optional customer ID
  customerName: string; // Name of the customer
  customerNumber: string; // Phone number of the customer
  totalPrice: number; // Total price of the booking
  advancePayment?: number; // Optional advance payment
  notes?: string; // Optional notes for the booking
  bookingSlots: BookingSlot[];
};
