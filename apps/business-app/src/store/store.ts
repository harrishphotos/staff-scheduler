// Redux store configuration for the application
import { configureStore } from "@reduxjs/toolkit";

// Import reducers from different slices
import staffReducer from "./slices/staffSlice"; // Manages staff-related state
import serviceReducer from "./slices/serviceSlice"; // Manages service-related state
import availabilityReducer from "./slices/availabilitySlice"; // Manages availability-related state

/**
 * Configure the Redux store with all the slices.
 * Each slice corresponds to a specific feature or domain in the application.
 */
const store = configureStore({
  reducer: {
    staff: staffReducer, // Handles staff-related state
    service: serviceReducer, // Handles service-related state
    availability: availabilityReducer, // Handles availability-related state
  },
});

/**
 * Type definition for the root state of the Redux store.
 * Represents the combined state of all slices.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Type definition for the dispatch function of the Redux store.
 * Useful for typing dispatching actions in components.
 */
export type AppDispatch = typeof store.dispatch;

// Export the configured store for use in the application
export default store;
