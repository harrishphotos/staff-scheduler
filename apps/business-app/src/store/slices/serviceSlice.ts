import { createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Service, services } from "../../types/service";
import { fetchServices } from "../thunks/serviceThunk";

/**
 * Define the shape of the service state.
 */
interface ServiceState {
  services: Service[]; // List of services fetched from the server
  loading: boolean; // Indicates whether a fetch operation is in progress
  error: string | null; // Stores error messages if a fetch operation fails
}

/**
 * Initial Redux state for services.
 */
const initialState: ServiceState = {
  services: services, // No services are loaded initially
  loading: false, // No fetch operation is in progress initially
  error: null, // No error is present initially
};

/**
 * Define the Redux slice for service-related state.
 */
const serviceSlice = createSlice({
  name: "service", // Name of the slice
  initialState, // Initial state for the slice
  reducers: {},
  extraReducers: (builder) => {
    builder
      /**
       * Handles the pending state of the fetchServices thunk.
       * Sets `loading` to true and clears any existing error.
       */
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handles the fulfilled state of the fetchServices thunk.
       * Updates the state with the fetched services.
       */
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })

      /**
       * Handles the rejected state of the fetchServices thunk.
       * Sets `loading` to false and updates the state with the error message.
       */
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export the reducer to be included in the Redux store
export default serviceSlice.reducer;

// Selectors for retrieving specific parts of the state

/**
 * Selector to retrieve the list of services.
 * @param state - The root Redux state.
 * @returns An array of services.
 */
export const selectServices = (state: RootState) => state.service.services;

/**
 * Memoized selector to retrieve the status of the service state.
 * Combines multiple state properties into a single object for convenience.
 * @param state - The root Redux state.
 * @returns An object containing:
 * - `loading`: Whether a fetch operation is in progress.
 * - `error`: Any error message from a failed fetch operation.
 */
export const selectServiceStateStatus = createSelector(
  (state: RootState) => state.service.loading,
  (state: RootState) => state.service.error,
  (loading, error) => ({
    serviceStateLoading: loading,
    serviceStateError: error,
  })
);
