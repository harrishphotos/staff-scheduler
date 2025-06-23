import { createSlice, createSelector, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
  Schedule,
  RecurringBreak,
  OnetimeBlock,
  WeeklySchedule,
} from "../../types/availability";

// Define the shape of the availability state
interface AvailabilityState {
  // Data
  schedules: Schedule[];
  recurringBreaks: RecurringBreak[];
  onetimeBlocks: OnetimeBlock[];

  // UI State
  selectedEmployeeId: string | null;
  activeTab: "schedules" | "breaks" | "blocks" | "overview";

  // Loading states
  loading: {
    schedules: boolean;
    recurringBreaks: boolean;
    onetimeBlocks: boolean;
  };

  // Error states
  error: {
    schedules: string | null;
    recurringBreaks: string | null;
    onetimeBlocks: string | null;
  };

  // Modal states
  modals: {
    schedule: {
      isOpen: boolean;
      mode: "add" | "edit";
      data: Schedule | null;
    };
    recurringBreak: {
      isOpen: boolean;
      mode: "add" | "edit";
      data: RecurringBreak | null;
    };
    onetimeBlock: {
      isOpen: boolean;
      mode: "add" | "edit";
      data: OnetimeBlock | null;
    };
  };
}

// Initial state
const initialState: AvailabilityState = {
  // Data
  schedules: [],
  recurringBreaks: [],
  onetimeBlocks: [],

  // UI State
  selectedEmployeeId: null,
  activeTab: "overview",

  // Loading states
  loading: {
    schedules: false,
    recurringBreaks: false,
    onetimeBlocks: false,
  },

  // Error states
  error: {
    schedules: null,
    recurringBreaks: null,
    onetimeBlocks: null,
  },

  // Modal states
  modals: {
    schedule: {
      isOpen: false,
      mode: "add",
      data: null,
    },
    recurringBreak: {
      isOpen: false,
      mode: "add",
      data: null,
    },
    onetimeBlock: {
      isOpen: false,
      mode: "add",
      data: null,
    },
  },
};

// Create the slice
const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    // Employee selection
    setSelectedEmployee: (state, action: PayloadAction<string | null>) => {
      state.selectedEmployeeId = action.payload;
      // Clear data when switching employees
      state.schedules = [];
      state.recurringBreaks = [];
      state.onetimeBlocks = [];
    },

    // Tab navigation
    setActiveTab: (
      state,
      action: PayloadAction<"schedules" | "breaks" | "blocks" | "overview">
    ) => {
      state.activeTab = action.payload;
    },

    // Schedule actions
    setSchedulesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.schedules = action.payload;
    },
    setSchedulesError: (state, action: PayloadAction<string | null>) => {
      state.error.schedules = action.payload;
    },
    setSchedules: (state, action: PayloadAction<Schedule[]>) => {
      state.schedules = action.payload;
      state.loading.schedules = false;
      state.error.schedules = null;
    },
    addSchedule: (state, action: PayloadAction<Schedule>) => {
      state.schedules.push(action.payload);
    },
    updateSchedule: (state, action: PayloadAction<Schedule>) => {
      const index = state.schedules.findIndex(
        (s) => s.id === action.payload.id
      );
      if (index !== -1) {
        state.schedules[index] = action.payload;
      }
    },
    removeSchedule: (state, action: PayloadAction<string>) => {
      state.schedules = state.schedules.filter((s) => s.id !== action.payload);
    },

    // Recurring break actions
    setRecurringBreaksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.recurringBreaks = action.payload;
    },
    setRecurringBreaksError: (state, action: PayloadAction<string | null>) => {
      state.error.recurringBreaks = action.payload;
    },
    setRecurringBreaks: (state, action: PayloadAction<RecurringBreak[]>) => {
      state.recurringBreaks = action.payload;
      state.loading.recurringBreaks = false;
      state.error.recurringBreaks = null;
    },
    addRecurringBreak: (state, action: PayloadAction<RecurringBreak>) => {
      state.recurringBreaks.push(action.payload);
    },
    updateRecurringBreak: (state, action: PayloadAction<RecurringBreak>) => {
      const index = state.recurringBreaks.findIndex(
        (b) => b.id === action.payload.id
      );
      if (index !== -1) {
        state.recurringBreaks[index] = action.payload;
      }
    },
    removeRecurringBreak: (state, action: PayloadAction<string>) => {
      state.recurringBreaks = state.recurringBreaks.filter(
        (b) => b.id !== action.payload
      );
    },

    // One-time block actions
    setOnetimeBlocksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.onetimeBlocks = action.payload;
    },
    setOnetimeBlocksError: (state, action: PayloadAction<string | null>) => {
      state.error.onetimeBlocks = action.payload;
    },
    setOnetimeBlocks: (state, action: PayloadAction<OnetimeBlock[]>) => {
      state.onetimeBlocks = action.payload;
      state.loading.onetimeBlocks = false;
      state.error.onetimeBlocks = null;
    },
    addOnetimeBlock: (state, action: PayloadAction<OnetimeBlock>) => {
      state.onetimeBlocks.push(action.payload);
    },
    updateOnetimeBlock: (state, action: PayloadAction<OnetimeBlock>) => {
      const index = state.onetimeBlocks.findIndex(
        (b) => b.id === action.payload.id
      );
      if (index !== -1) {
        state.onetimeBlocks[index] = action.payload;
      }
    },
    removeOnetimeBlock: (state, action: PayloadAction<string>) => {
      state.onetimeBlocks = state.onetimeBlocks.filter(
        (b) => b.id !== action.payload
      );
    },

    // Modal actions
    openScheduleModal: (
      state,
      action: PayloadAction<{ mode: "add" | "edit"; data?: Schedule }>
    ) => {
      state.modals.schedule.isOpen = true;
      state.modals.schedule.mode = action.payload.mode;
      state.modals.schedule.data = action.payload.data || null;
    },
    closeScheduleModal: (state) => {
      state.modals.schedule.isOpen = false;
      state.modals.schedule.data = null;
    },

    openRecurringBreakModal: (
      state,
      action: PayloadAction<{ mode: "add" | "edit"; data?: RecurringBreak }>
    ) => {
      state.modals.recurringBreak.isOpen = true;
      state.modals.recurringBreak.mode = action.payload.mode;
      state.modals.recurringBreak.data = action.payload.data || null;
    },
    closeRecurringBreakModal: (state) => {
      state.modals.recurringBreak.isOpen = false;
      state.modals.recurringBreak.data = null;
    },

    openOnetimeBlockModal: (
      state,
      action: PayloadAction<{ mode: "add" | "edit"; data?: OnetimeBlock }>
    ) => {
      state.modals.onetimeBlock.isOpen = true;
      state.modals.onetimeBlock.mode = action.payload.mode;
      state.modals.onetimeBlock.data = action.payload.data || null;
    },
    closeOnetimeBlockModal: (state) => {
      state.modals.onetimeBlock.isOpen = false;
      state.modals.onetimeBlock.data = null;
    },

    // Clear all errors
    clearAllErrors: (state) => {
      state.error.schedules = null;
      state.error.recurringBreaks = null;
      state.error.onetimeBlocks = null;
    },
  },
});

// Export actions
export const {
  setSelectedEmployee,
  setActiveTab,
  setSchedulesLoading,
  setSchedulesError,
  setSchedules,
  addSchedule,
  updateSchedule,
  removeSchedule,
  setRecurringBreaksLoading,
  setRecurringBreaksError,
  setRecurringBreaks,
  addRecurringBreak,
  updateRecurringBreak,
  removeRecurringBreak,
  setOnetimeBlocksLoading,
  setOnetimeBlocksError,
  setOnetimeBlocks,
  addOnetimeBlock,
  updateOnetimeBlock,
  removeOnetimeBlock,
  openScheduleModal,
  closeScheduleModal,
  openRecurringBreakModal,
  closeRecurringBreakModal,
  openOnetimeBlockModal,
  closeOnetimeBlockModal,
  clearAllErrors,
} = availabilitySlice.actions;

// Export the reducer
export default availabilitySlice.reducer;

// Selectors
export const selectAvailabilityState = (state: RootState) => state.availability;

export const selectSelectedEmployee = (state: RootState) =>
  state.availability.selectedEmployeeId;

export const selectActiveTab = (state: RootState) =>
  state.availability.activeTab;

export const selectSchedules = createSelector(
  (state: RootState) => state.availability.schedules,
  (schedules) => schedules
);

export const selectWeeklySchedule = createSelector(
  selectSchedules,
  (schedules): WeeklySchedule => {
    return schedules.reduce((groups: WeeklySchedule, schedule: Schedule) => {
      const day = schedule.day_of_week;
      if (!groups[day]) groups[day] = [];
      groups[day].push(schedule);
      return groups;
    }, {} as WeeklySchedule);
  }
);

export const selectRecurringBreaks = createSelector(
  (state: RootState) => state.availability.recurringBreaks,
  (breaks) => breaks
);

export const selectRecurringBreaksByDay = createSelector(
  selectRecurringBreaks,
  (breaks) => {
    return breaks.reduce(
      (
        groups: { [key: number]: RecurringBreak[] },
        breakItem: RecurringBreak
      ) => {
        const day = breakItem.day_of_week;
        if (!groups[day]) groups[day] = [];
        groups[day].push(breakItem);
        return groups;
      },
      {} as { [key: number]: RecurringBreak[] }
    );
  }
);

export const selectOnetimeBlocks = createSelector(
  (state: RootState) => state.availability.onetimeBlocks,
  (blocks) => blocks
);

export const selectPastOnetimeBlocks = createSelector(
  selectOnetimeBlocks,
  (blocks) => {
    const now = new Date();
    return blocks.filter((block) => new Date(block.end_date_time) < now);
  }
);

export const selectFutureOnetimeBlocks = createSelector(
  selectOnetimeBlocks,
  (blocks) => {
    const now = new Date();
    return blocks.filter((block) => new Date(block.start_date_time) >= now);
  }
);

export const selectLoadingStates = createSelector(
  (state: RootState) => state.availability.loading,
  (loading) => loading
);

export const selectErrorStates = createSelector(
  (state: RootState) => state.availability.error,
  (error) => error
);

export const selectModalStates = createSelector(
  (state: RootState) => state.availability.modals,
  (modals) => modals
);
