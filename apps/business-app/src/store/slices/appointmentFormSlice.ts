// Redux slice for managing appointment form-related state
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Booking, BookingForm, BookingSlot } from "../../types/booking";
import {
  createAppointment,
  fetchAvailableStaffs,
  toggleService,
} from "../thunks/appointmentFormThunk";
import { availableStaffdemo, AvailableStaff } from "../../types/staff";

/**
 * Defines the shape of the appointment form state.
 */
interface AppointmentFormState {
  step: number; // Current step in the appointment form process
  formData: BookingForm; // Booking data or null if not started
  startTime: string | null; // Start time of the appointment (ISO string)
  bookingSlots: BookingSlot[]; // List of booking slots for the appointment
  availableStaff: AvailableStaff[]; // Optional field for available staff
  loading: boolean; // Indicates whether a fetch or update operation is in progress
  error: string | null; // Stores error messages if an operation fails
}

/**
 * Initial Redux state for the appointment form.
 */
const initialState: AppointmentFormState = {
  step: 0, // Initial step is 0
  formData: {
    customerName: "",
    customerNumber: "",
    notes: "",
    totalPrice: 0,
    bookingSlots: [],
  }, // No booking data initially
  startTime: null, // Start time is null initially
  bookingSlots: [], // No booking slots initially
  availableStaff: availableStaffdemo, // Optional, can be used to filter staff based on availability
  loading: false, // No operation is in progress initially
  error: null, // No error is present initially
};

/**
 * Define the Redux slice for appointment form-related state.
 */
const appointmentFormSlice = createSlice({
  name: "appointmentForm", // Name of the slice
  initialState, // Initial state for the slice
  reducers: {
    /**
     * Sets the current step in the appointment form process.
     * @param state - The current state of the slice.
     * @param action - The action containing the new step value.
     */
    setStep: (state, action) => {
      state.step = action.payload;
    },

    /**
     * Sets the start time for the appointment.
     * @param state - The current state of the slice.
     * @param action - The action containing the new start time value.
     */
    setStartTime: (state, action) => {
      state.startTime = action.payload;
    },

    /**
     * Updates the booking slots in the state.
     * @param state - The current state of the slice.
     * @param action - The action containing the new booking slots.
     */
    updateBookingSlots: (state, action) => {
      state.bookingSlots = action.payload;
    },

    /**
     * Assigns a staff member (artist) to a specific service in the booking slots.
     * @param state - The current state of the slice.
     * @param action - The action containing the serviceId and artistId.
     */
    assignStaffToService: (state, action) => {
      const { serviceId, staffId } = action.payload;

      // Find the booking slot with the matching serviceId and update its employee_id
      state.bookingSlots = state.bookingSlots.map((slot) =>
        slot.serviceId === serviceId ? { ...slot, staffId: staffId } : slot
      );
    },

    /**
     * Partially updates the formData with the provided data.
     * @param state - The current state of the slice.
     * @param action - The action containing the partial data to update.
     */
    updateFormData: (state, action) => {
      if (state.formData) {
        state.formData = { ...state.formData, ...action.payload };
      } else {
        state.formData = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      /**
       * Handles the pending state of the `toggleService` thunk.
       * Sets `loading` to true and clears any existing error.
       */
      .addCase(toggleService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handles the fulfilled state of the `toggleService` thunk.
       * Updates the state with the new list of booking slots.
       */
      .addCase(toggleService.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingSlots = action.payload;
      })

      /**
       * Handles the rejected state of the `toggleService` thunk.
       * Sets `loading` to false and updates the state with the error message.
       */
      .addCase(toggleService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to toggle service";
      })

      /**
       * Handles the pending state of the `fetchAvailableStaffs` thunk.
       * Sets `loading` to true and clears any existing error.
       */
      .addCase(fetchAvailableStaffs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handles the fulfilled state of the `fetchAvailableStaffs` thunk.
       * Updates the state with the list of available staff.
       */
      .addCase(fetchAvailableStaffs.fulfilled, (state, action) => {
        state.loading = false;
        state.availableStaff = action.payload;
      })

      /**
       * Handles the rejected state of the `fetchAvailableStaffs` thunk.
       * Sets `loading` to false and updates the state with the error message.
       */
      .addCase(fetchAvailableStaffs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch available staff";
      })

      /**
       * Handles the pending state of the `createAppointment` thunk.
       * Sets `loading` to true and clears any existing error.
       */
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handles the fulfilled state of the `createAppointment` thunk.
       * Resets the form state and sets `loading` to false.
       */
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.step = 0; // Reset the step
        state.formData = initialState.formData; // Reset formData
        state.startTime = null; // Reset startTime
        state.bookingSlots = []; // Clear booking slots
        state.availableStaff = initialState.availableStaff; // Reset available staff
        state.error = null; // Clear any error
      })

      /**
       * Handles the rejected state of the `createAppointment` thunk.
       * Sets `loading` to false and updates the state with the error message.
       */
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create appointment";
      });
  },
});

// Export actions for use in components
export const {
  setStep,
  setStartTime,
  updateBookingSlots,
  assignStaffToService,
  updateFormData,
} = appointmentFormSlice.actions;

// Export the reducer to be included in the Redux store
export default appointmentFormSlice.reducer;

/**
 * Memoized selector to retrieve the loading and error status of the appointment form state.
 * Combines multiple state properties into a single object for convenience.
 * @param state - The root Redux state.
 * @returns An object containing:
 * - `appointmentFormStateLoading`: Whether an operation is in progress.
 * - `appointmentFormStateError`: Any error message from a failed operation.
 */
export const selectAppointmentFormStateStatus = createSelector(
  (state: RootState) => state.appointmentForm.loading,
  (state: RootState) => state.appointmentForm.error,
  (loading, error) => ({
    appointmentFormStateLoading: loading,
    appointmentFormStateError: error,
  })
);

/**
 * Selector to retrieve the appointment form data, start time, and booking slots.
 * Combines `formData`, `startTime`, and `bookingSlots` into a single object for convenience.
 * @param state - The root Redux state.
 * @returns An object containing:
 * - `formData`: The booking data.
 * - `startTime`: The start time of the appointment.
 * - `bookingSlots`: The list of booking slots for the appointment.
 */
export const selectAppointmentForm = createSelector(
  (state: RootState) => state.appointmentForm.formData,
  (state: RootState) => state.appointmentForm.startTime,
  (state: RootState) => state.appointmentForm.bookingSlots,
  (state: RootState) => state.appointmentForm.availableStaff,
  (formData, startTime, bookingSlots, availableStaff) => ({
    formData,
    startTime,
    bookingSlots,
    availableStaff,
  })
);
