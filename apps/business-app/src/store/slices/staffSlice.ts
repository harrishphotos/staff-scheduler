import { createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
} from "../thunks/staffThunk";
import { demoStaffs, Staff } from "../../types/staff";

/**
 * Defines the shape of the staff state.
 */
interface StaffState {
  staffList: Staff[]; // List of staff members
  selectedStaff: Staff | null; // Currently selected staff for editing
  isStaffFetched: boolean; // Indicates whether staff data has been fetched
  loading: boolean; // Indicates whether a fetch operation is in progress
  error: string | null; // Stores error messages if a fetch operation fails
  isModalOpen: boolean; // Controls modal visibility
  modalMode: "add" | "edit"; // Modal mode for add or edit
}

/**
 * Initial Redux state for staff.
 */
const initialState: StaffState = {
  staffList: [], // Start with empty array, will fetch from API
  selectedStaff: null, // No staff selected initially
  isStaffFetched: false, // Staff data has not been fetched initially
  loading: false, // No fetch operation is in progress initially
  error: null, // No error is present initially
  isModalOpen: false, // Modal is closed initially
  modalMode: "add", // Default mode is add
};

/**
 * Define the Redux slice for staff-related state.
 */
const staffSlice = createSlice({
  name: "staff", // Name of the slice
  initialState, // Initial state for the slice
  reducers: {
    // Open modal for adding new staff
    openAddModal: (state) => {
      state.isModalOpen = true;
      state.modalMode = "add";
      state.selectedStaff = null;
      state.error = null;
    },

    // Open modal for editing existing staff
    openEditModal: (state, action) => {
      state.isModalOpen = true;
      state.modalMode = "edit";
      state.selectedStaff = action.payload;
      state.error = null;
    },

    // Close modal
    closeModal: (state) => {
      state.isModalOpen = false;
      state.selectedStaff = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Staff Cases
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.isStaffFetched = true;
        state.staffList = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Staff Cases
      .addCase(createStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList.push(action.payload);
        state.isModalOpen = false;
        state.selectedStaff = null;
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Staff Cases
      .addCase(updateStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStaff = action.payload;
        const index = state.staffList.findIndex(
          (staff) => staff.id === updatedStaff.id
        );
        if (index !== -1) {
          state.staffList[index] = updatedStaff;
        }
        state.isModalOpen = false;
        state.selectedStaff = null;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete Staff Cases
      .addCase(deleteStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = state.staffList.filter(
          (staff) => staff.id !== action.payload
        );
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Toggle Staff Status Cases
      .addCase(toggleStaffStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleStaffStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStaff = action.payload;
        const index = state.staffList.findIndex(
          (staff) => staff.id === updatedStaff.id
        );
        if (index !== -1) {
          state.staffList[index] = updatedStaff;
        }
      })
      .addCase(toggleStaffStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { openAddModal, openEditModal, closeModal, clearError } =
  staffSlice.actions;

// Export the reducer to be included in the Redux store
export default staffSlice.reducer;

/**
 * Selector to retrieve the staff list from the state.
 * @param state - The root Redux state.
 * @returns An object containing the staff list.
 */
export const selectStaffState = createSelector(
  (state: RootState) => state.staff.staffList,
  (staffList) => ({
    staffList,
  })
);

/**
 * Memoized selector to retrieve the status of the staff state.
 * Combines multiple state properties into a single object for convenience.
 * @param state - The root Redux state.
 * @returns An object containing:
 * - `isStaffFetched`: Whether staff data has been fetched.
 * - `loading`: Whether a fetch operation is in progress.
 * - `error`: Any error message from a failed fetch operation.
 */
export const selectStaffStateStatus = createSelector(
  (state: RootState) => state.staff.isStaffFetched,
  (state: RootState) => state.staff.loading,
  (state: RootState) => state.staff.error,
  (isStaffFetched, loading, error) => ({
    isStaffFetched,
    loading,
    error,
  })
);

/**
 * Selector for modal-related state
 */
export const selectStaffModalState = createSelector(
  (state: RootState) => state.staff.isModalOpen,
  (state: RootState) => state.staff.modalMode,
  (state: RootState) => state.staff.selectedStaff,
  (isModalOpen, modalMode, selectedStaff) => ({
    isModalOpen,
    modalMode,
    selectedStaff,
  })
);
