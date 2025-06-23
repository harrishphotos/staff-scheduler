import { createAsyncThunk } from "@reduxjs/toolkit";
import { Service } from "../../types/service";

/**
 * Thunk to fetch services from the server.
 * @param salonId - The ID of the salon to fetch services for.
 * @returns A list of services or an error message if the fetch fails.
 */
export const fetchServices = createAsyncThunk<
  Service[], // Response type
  { salonId: string }, // Params
  { rejectValue: string } // Rejection type
>("service/fetchServices", async ({ salonId }, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `http://localhost:3004/getAllServices?salon_id=${encodeURIComponent(
        salonId
      )}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    const data: Service[] = await response.json();
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "An error occurred while fetching services"
    );
  }
});
