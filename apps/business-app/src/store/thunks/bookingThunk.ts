import { createAsyncThunk } from "@reduxjs/toolkit";
import { Booking } from "../../types/booking";

// Define the thunk
export const fetchBookings = createAsyncThunk<
  Booking[], // Response type
  { salonId: string; start: string; end: string }, // Params
  { rejectValue: string } // Rejection type
>(
  "booking/fetchBookings",
  async ({ salonId, start, end }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `http://localhost:3001/getBookings?salon_id=${encodeURIComponent(
          salonId
        )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data: Booking[] = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "An error occurred while fetching bookings"
      );
    }
  }
);
