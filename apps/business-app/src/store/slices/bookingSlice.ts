// Redux slice for managing booking-related state
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Booking } from "../../types/booking";
import { fetchBookings } from "../thunks/bookingThunk";

// Define the shape of the booking state
interface BookingState {
  BookingDrawerVisible: boolean; // Controls the visibility of the booking drawer
  Bookings: Booking[]; // List of bookings fetched from the server
  isBookingfetched: boolean; // Indicates whether bookings have been fetched
  loading: boolean; // Indicates whether a fetch operation is in progress
  error: string | null; // Stores error messages if a fetch operation fails
}

// Initial Redux state
const initialState: BookingState = {
  BookingDrawerVisible: false, // Drawer is initially hidden
  Bookings: [], // No bookings are loaded initially
  isBookingfetched: false, // Bookings are not fetched initially
  loading: false, // No fetch operation is in progress initially
  error: null, // No error is present initially
};

// Define the Redux slice for booking-related state
const bookingSlice = createSlice({
  name: "booking", // Name of the slice
  initialState, // Initial state for the slice
  reducers: {
    /**
     * Toggles the visibility of the booking drawer.
     * If the drawer is visible, it will be hidden, and vice versa.
     */
    toggleDrawerVisibility: (state) => {
      state.BookingDrawerVisible = !state.BookingDrawerVisible;
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * Handles the pending state of the fetchBookings thunk.
       * Sets `loading` to true and clears any existing error.
       */
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handles the fulfilled state of the fetchBookings thunk.
       * Updates the state with the fetched bookings and marks them as fetched.
       */
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.isBookingfetched = true;
        state.Bookings = action.payload;
      })

      /**
       * Handles the rejected state of the fetchBookings thunk.
       * Sets `loading` to false and updates the state with the error message.
       */
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions for use in components
export const { toggleDrawerVisibility } = bookingSlice.actions;

// Export the reducer to be included in the Redux store
export default bookingSlice.reducer;

// Selectors for retrieving specific parts of the state

/**
 * Selector to retrieve the visibility state of the booking drawer.
 * @param state - The root Redux state.
 * @returns `true` if the drawer is visible, otherwise `false`.
 */
export const selectBookingDrawerVisible = (state: RootState) =>
  state.booking.BookingDrawerVisible;

/**
 * Selector to retrieve the list of bookings.
 * @param state - The root Redux state.
 * @returns An array of bookings.
 */
export const selectBookings = (state: RootState) => state.booking.Bookings;

/**
 * Memoized selector to retrieve the status of the booking state.
 * Combines multiple state properties into a single object for convenience.
 * @param state - The root Redux state.
 * @returns An object containing:
 * - `isBookingfetched`: Whether bookings have been fetched.
 * - `bookingStateLoading`: Whether a fetch operation is in progress.
 * - `bookingStateError`: Any error message from a failed fetch operation.
 */
export const selectBookingStateStatus = createSelector(
  (state: RootState) => state.booking.isBookingfetched,
  (state: RootState) => state.booking.loading,
  (state: RootState) => state.booking.error,
  (isBookingfetched, loading, error) => ({
    isBookingfetched,
    bookingStateLoading: loading,
    bookingStateError: error,
  })
);
