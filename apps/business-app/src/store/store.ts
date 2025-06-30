// Redux store configuration for the application
import { configureStore } from "@reduxjs/toolkit";

// Import reducers from different slices
import staffReducer from "./slices/staffSlice"; // Manages staff-related state
import availabilityReducer from "./slices/availabilitySlice"; // Manages availability-related state
import authReducer from "./slices/authSlice";

// redux-persist imports
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

/**
 * Configure the Redux store with all the slices.
 * Each slice corresponds to a specific feature or domain in the application.
 */

// Combine reducers first so we can apply persist only to desired slices
const rootReducer = combineReducers({
  staff: staffReducer,
  availability: availabilityReducer,
  auth: authReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // only auth slice is persisted
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

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
