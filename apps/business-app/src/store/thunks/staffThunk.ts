import { createAsyncThunk } from "@reduxjs/toolkit";
import { Staff } from "../../types/staff";
import { staffAPI } from "../../utils/staffApi";

// Fetch all staff members
export const fetchStaff = createAsyncThunk<
  Staff[], // Response type
  void, // No params needed for fetch all
  { rejectValue: string } // Rejection type
>("staff/fetchStaff", async (_, { rejectWithValue }) => {
  try {
    console.log("🔄 Fetching staff from API...");
    const staff = await staffAPI.getAll();
    console.log("✅ Staff fetched successfully:", staff);
    return staff;
  } catch (error: any) {
    console.error("❌ Staff fetch error:", error);
    return rejectWithValue(
      error.message || "An error occurred while fetching staff"
    );
  }
});

// Create new staff member
export const createStaff = createAsyncThunk<
  Staff, // Response type
  Omit<Staff, "id" | "createdAt" | "updatedAt">, // Params
  { rejectValue: string } // Rejection type
>("staff/createStaff", async (staffData, { rejectWithValue }) => {
  try {
    const newStaff = await staffAPI.create(staffData);
    return newStaff;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "An error occurred while creating staff member"
    );
  }
});

// Update existing staff member
export const updateStaff = createAsyncThunk<
  Staff, // Response type
  { id: string; updates: Partial<Staff> }, // Params
  { rejectValue: string } // Rejection type
>("staff/updateStaff", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const updatedStaff = await staffAPI.update(id, updates);
    return updatedStaff;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "An error occurred while updating staff member"
    );
  }
});

// Delete staff member
export const deleteStaff = createAsyncThunk<
  string, // Response type (returns the ID)
  string, // Params (staff ID)
  { rejectValue: string } // Rejection type
>("staff/deleteStaff", async (staffId, { rejectWithValue }) => {
  try {
    await staffAPI.delete(staffId);
    return staffId;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "An error occurred while deleting staff member"
    );
  }
});

// Toggle staff active status
export const toggleStaffStatus = createAsyncThunk<
  Staff, // Response type
  { id: string; isActive: boolean }, // Params
  { rejectValue: string } // Rejection type
>("staff/toggleStaffStatus", async ({ id, isActive }, { rejectWithValue }) => {
  try {
    const updatedStaff = await staffAPI.toggleActiveStatus(id, isActive);
    return updatedStaff;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "An error occurred while updating staff status"
    );
  }
});
