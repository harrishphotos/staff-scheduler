import { addMinutes, formatISO, parseISO } from "date-fns";
import { Service } from "../../types/service";
import { RootState } from "../store";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { enqueue } from "../../utils/Mutex";
import { AvailableStaff } from "../../types/staff";
import { BookingForm, BookingSlot } from "../../types/booking";

/**
 * Async thunk to toggle a service in the appointment form.
 * Adds or removes a service from the booking slots based on its current state.
 * Ensures that the booking slots are recomputed to maintain sequential timing.
 *
 * @param service - The service to toggle (add or remove).
 * @returns A list of updated booking slots.
 * @throws Error if `startTime` is not set in the appointment form state.
 */
export const toggleService = createAsyncThunk<
  BookingSlot[], // Response type: Updated booking slots
  Service, // Input type: Service to toggle
  { state: RootState } // ThunkAPI type: Access to Redux state
>("appointmentForm/toggleService", async (service, thunkAPI) => {
  return await enqueue(async () => {
    // Retrieve the current appointment form state
    const state = thunkAPI.getState().appointmentForm;

    // Ensure that `startTime` is set; otherwise, throw an error
    if (!state.startTime) {
      throw new Error("startTime is not set");
    }

    // Copy the current booking slots
    const current = [...state.bookingSlots];

    // Check if the service already exists in the booking slots
    const exists = current.find((s) => s.serviceId === service.serviceId);

    let newSlots: BookingSlot[];

    if (exists) {
      // If the service exists, remove it from the booking slots
      newSlots = current.filter((s) => s.serviceId !== service.serviceId);
    } else {
      // If the service does not exist, add it to the booking slots
      newSlots = [
        ...current,
        {
          serviceId: service.serviceId, // Service ID
          startTime: state.startTime, // Start time of the service
          endTime: formatISO(
            addMinutes(parseISO(state.startTime), service.duration)
          ), // End time computed based on service duration
          staffId: "", // Employee ID (empty for now)
          isPackaged: service.isPackaged, // Indicates if the service is part of a package
        },
      ];
    }

    /**
     * Compute the durations for all booking slots.
     * If the service is newly added, use its duration; otherwise, use the original duration.
     */
    const durations = newSlots.map((slot, idx) => {
      if (slot.serviceId === service.serviceId && !exists) {
        return service.duration; // Use the service duration for newly added slots
      }
      const orig = current.find((s) => s.serviceId === slot.serviceId);
      return orig
        ? (new Date(orig.endTime).getTime() -
            new Date(orig.startTime).getTime()) /
            60000 // Compute duration in minutes
        : 0;
    });

    /**
     * Recompute the booking slots to ensure sequential timing.
     * Adjusts the start and end times for all slots based on their durations.
     */
    const recomputed: BookingSlot[] = [];
    let cursor = parseISO(state.startTime); // Start cursor at the initial start time

    for (let i = 0; i < newSlots.length; i++) {
      const dur = durations[i]; // Duration of the current slot
      const start = cursor; // Start time of the current slot
      const end = addMinutes(start, dur); // End time computed based on duration

      // Add the recomputed slot to the list
      recomputed.push({
        ...newSlots[i],
        startTime: formatISO(start), // Format start time as ISO string
        endTime: formatISO(end), // Format end time as ISO string
      });

      // Move the cursor to the end time for the next slot
      cursor = end;
    }

    // Return the recomputed booking slots
    return recomputed;
  });
});

export interface AvailableStaffRequest {
  salonId: string; // ID of the salon to fetch staff availability for
  serviceIds: string[]; // List of service IDs to filter available staff
  startTime: string; // Start time in ISO format to check availability
  endTime: string; // End time in ISO format to check availability
}

/**
 * Async thunk to fetch available staff based on the booking slots.
 * Converts the `bookingSlots` array into the `availableStaffRequest` format and sends it to the server.
 *
 * @returns A list of available staff or an error message if the fetch fails.
 */
export const fetchAvailableStaffs = createAsyncThunk<
  AvailableStaff[], // Response type: List of available staff
  void, // No input parameters
  { state: RootState; rejectValue: string } // ThunkAPI type: Access to Redux state and rejection type
>("appointmentForm/fetchAvailableStaffs", async (_, thunkAPI) => {
  try {
    // Retrieve the current appointment form state
    const state = thunkAPI.getState().appointmentForm;

    // Ensure that bookingSlots are available
    if (state.bookingSlots.length === 0) {
      throw new Error("No booking slots available to fetch staff.");
    }

    // Extract the start time and end time from the bookingSlots array
    const startTime = state.bookingSlots[0].startTime; // Start time of the first booking slot
    const endTime = state.bookingSlots[state.bookingSlots.length - 1].endTime; // End time of the last booking slot

    // Extract the service IDs from the bookingSlots array
    const serviceIds = state.bookingSlots.map((slot) => slot.serviceId);

    // Create the availableStaffRequest object
    const requestPayload: AvailableStaffRequest = {
      salonId: "00000000-0000-0000-0000-000000000001", // Default salon ID
      serviceIds, // List of service IDs
      startTime, // Start time in ISO format
      endTime, // End time in ISO format
    };

    // Send the request to the server
    const response = await fetch("http://localhost:3001/getAvailableStaffs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error("Failed to fetch available staff.");
    }

    // Parse the response JSON
    const data: AvailableStaff[] = await response.json();

    // Return the list of available staff
    return data;
  } catch (error: any) {
    // Reject the thunk with an error message
    return thunkAPI.rejectWithValue(
      error.message || "An error occurred while fetching available staff."
    );
  }
});

/**
 * Utility to check if a field is empty.
 */
function isFieldEmpty(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Async thunk to create an appointment.
 *
 * This thunk sends a POST request to the backend to create a new appointment.
 * It validates the required fields in the `formData` from the Redux state and
 * constructs the request payload. If the request is successful, the created
 * appointment data is returned. Otherwise, it handles errors and rejects the thunk.
 *
 * @returns The created appointment data on success.
 * @throws Rejects with an error message if the request fails or validation fails.
 */
export const createAppointment = createAsyncThunk<
  any, // Response type: The created appointment data
  void, // Input type: No input parameters
  { state: RootState; rejectValue: string } // ThunkAPI type: Access to Redux state and rejection type
>("appointmentForm/createAppointment", async (_, thunkAPI) => {
  try {
    // Retrieve the current Redux state
    const state = thunkAPI.getState();
    const { formData } = state.appointmentForm;
    const salonId = "00000000-0000-0000-0000-000000000001"; // Default salon ID

    // Ensure formData is set in the Redux state
    if (!formData) {
      throw new Error("formData is not set in the appointment form state.");
    }

    // Define the required fields for validation
    const requiredFields: (keyof BookingForm)[] = [
      "customerName",
      "customerNumber",
      "bookingSlots",
      "totalPrice",
    ];

    // Validate that all required fields are present and not empty
    for (const field of requiredFields) {
      const value = formData[field];
      if (isFieldEmpty(value)) {
        throw new Error(
          `Compulsory field '${String(field)}' is missing or empty in formData.`
        );
      }
    }

    // Send the POST request to the backend
    const response = await fetch(
      `http://localhost:3001/createAppointment/${salonId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send formData as the request body
      }
    );

    // Check if the response is successful
    if (!response.ok) {
      throw new Error("Failed to create appointment.");
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error: any) {
    // Reject the thunk with an error message
    return thunkAPI.rejectWithValue(
      error.message || "An error occurred while creating the appointment."
    );
  }
});
