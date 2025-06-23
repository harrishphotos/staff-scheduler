import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface BookingViewState {
  bookingViewType: "list" | "calendar";
  bookingViewDate: string; // Changed to string for ISO format
  selectedSlot: {
    start: string;
    end: string;
    date?: string;
  } | null;
}

const initialState: BookingViewState = {
  bookingViewType: "calendar",
  bookingViewDate: new Date().toISOString(), // Initialize as ISO string
  selectedSlot: null,
};

const bookingViewSlice = createSlice({
  name: "bookingView",
  initialState,
  reducers: {
    setBookingViewType: (state, action) => {
      state.bookingViewType = action.payload;
    },
    setBookingViewDate: (state, action) => {
      // Ensure the date is stored as an ISO string
      state.bookingViewDate = new Date(action.payload).toISOString();
    },
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
  },
});

// Export actions
export const { setBookingViewType, setBookingViewDate, setSelectedSlot } =
  bookingViewSlice.actions;
export default bookingViewSlice.reducer;

// Selectors for retrieving specific parts of the state
export const selectBookingViewType = (state: RootState) =>
  state.bookingView.bookingViewType;
export const selectBookingViewDate = (state: RootState) =>
  state.bookingView.bookingViewDate;
export const selectSelectedSlot = (state: RootState) =>
  state.bookingView.selectedSlot;
