import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  Schedule,
  RecurringBreak,
  OnetimeBlock,
  CreateScheduleRequest,
  CreateRecurringBreakRequest,
  CreateOnetimeBlockRequest,
  AvailabilityRequest,
  AvailabilityResponse,
  EmployeeAvailabilityRequest,
  EmployeeAvailabilityResponse,
} from "../../types/availability";
import { availabilityAPI } from "../../utils/availabilityApi";
import {
  setSchedulesLoading,
  setSchedulesError,
  setSchedules,
  addSchedule,
  setRecurringBreaksLoading,
  setRecurringBreaksError,
  setRecurringBreaks,
  addRecurringBreak,
  setOnetimeBlocksLoading,
  setOnetimeBlocksError,
  setOnetimeBlocks,
  addOnetimeBlock,
  updateOnetimeBlock,
  setEmployeeAvailabilityLoading,
  setEmployeeAvailabilityError,
  setEmployeeAvailability,
  closeScheduleModal,
  closeRecurringBreakModal,
  closeOnetimeBlockModal,
} from "../slices/availabilitySlice";

// Schedule Thunks
export const fetchSchedules = createAsyncThunk<
  void,
  string, // employeeId
  { rejectValue: string }
>(
  "availability/fetchSchedules",
  async (employeeId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSchedulesLoading(true));
      const schedules = await availabilityAPI.schedules.getByEmployee(
        employeeId
      );
      dispatch(setSchedules(schedules));
    } catch (error: any) {
      const message = error.message || "Failed to fetch schedules";
      dispatch(setSchedulesError(message));
      return rejectWithValue(message);
    }
  }
);

export const createSchedule = createAsyncThunk<
  void,
  CreateScheduleRequest,
  { rejectValue: string }
>(
  "availability/createSchedule",
  async (scheduleData, { dispatch, rejectWithValue }) => {
    try {
      const newSchedule = await availabilityAPI.schedules.create(scheduleData);
      dispatch(addSchedule(newSchedule));
      dispatch(closeScheduleModal());
    } catch (error: any) {
      const message = error.message || "Failed to create schedule";
      return rejectWithValue(message);
    }
  }
);

export const deleteSchedule = createAsyncThunk<
  void,
  string, // scheduleId
  { rejectValue: string }
>(
  "availability/deleteSchedule",
  async (scheduleId, { dispatch, rejectWithValue }) => {
    try {
      await availabilityAPI.schedules.delete(scheduleId);
      // Re-fetch schedules to update the UI
      // We'll need the employeeId, so we'll handle this in the component for now
      dispatch(closeScheduleModal());
    } catch (error: any) {
      const message = error.message || "Failed to delete schedule";
      return rejectWithValue(message);
    }
  }
);

// Recurring Break Thunks
export const fetchRecurringBreaks = createAsyncThunk<
  void,
  string, // employeeId
  { rejectValue: string }
>(
  "availability/fetchRecurringBreaks",
  async (employeeId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setRecurringBreaksLoading(true));
      const breaks = await availabilityAPI.recurringBreaks.getByEmployee(
        employeeId
      );
      dispatch(setRecurringBreaks(breaks));
    } catch (error: any) {
      const message = error.message || "Failed to fetch recurring breaks";
      dispatch(setRecurringBreaksError(message));
      return rejectWithValue(message);
    }
  }
);

export const createRecurringBreak = createAsyncThunk<
  void,
  CreateRecurringBreakRequest,
  { rejectValue: string }
>(
  "availability/createRecurringBreak",
  async (breakData, { dispatch, rejectWithValue }) => {
    try {
      const newBreak = await availabilityAPI.recurringBreaks.create(breakData);
      dispatch(addRecurringBreak(newBreak));
      dispatch(closeRecurringBreakModal());
    } catch (error: any) {
      const message = error.message || "Failed to create recurring break";
      return rejectWithValue(message);
    }
  }
);

export const deleteRecurringBreak = createAsyncThunk<
  void,
  string, // breakId
  { rejectValue: string }
>(
  "availability/deleteRecurringBreak",
  async (breakId, { dispatch, rejectWithValue }) => {
    try {
      await availabilityAPI.recurringBreaks.delete(breakId);
      dispatch(closeRecurringBreakModal());
    } catch (error: any) {
      const message = error.message || "Failed to delete recurring break";
      return rejectWithValue(message);
    }
  }
);

// One-time Block Thunks
export const fetchOnetimeBlocks = createAsyncThunk<
  void,
  string, // employeeId
  { rejectValue: string }
>(
  "availability/fetchOnetimeBlocks",
  async (employeeId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setOnetimeBlocksLoading(true));
      const blocks = await availabilityAPI.onetimeBlocks.getByEmployee(
        employeeId
      );
      dispatch(setOnetimeBlocks(blocks));
    } catch (error: any) {
      const message = error.message || "Failed to fetch one-time blocks";
      dispatch(setOnetimeBlocksError(message));
      return rejectWithValue(message);
    }
  }
);

export const createOnetimeBlock = createAsyncThunk<
  void,
  CreateOnetimeBlockRequest,
  { rejectValue: string }
>(
  "availability/createOnetimeBlock",
  async (blockData, { dispatch, rejectWithValue }) => {
    try {
      const newBlock = await availabilityAPI.onetimeBlocks.create(blockData);
      dispatch(addOnetimeBlock(newBlock));
      dispatch(closeOnetimeBlockModal());
    } catch (error: any) {
      const message = error.message || "Failed to create one-time block";
      return rejectWithValue(message);
    }
  }
);

export const updateOnetimeBlockThunk = createAsyncThunk<
  void,
  { blockId: string; blockData: CreateOnetimeBlockRequest },
  { rejectValue: string }
>(
  "availability/updateOnetimeBlock",
  async ({ blockId, blockData }, { dispatch, rejectWithValue }) => {
    try {
      const updatedBlock = await availabilityAPI.onetimeBlocks.update(
        blockId,
        blockData
      );
      dispatch(updateOnetimeBlock(updatedBlock));
      dispatch(closeOnetimeBlockModal());
    } catch (error: any) {
      const message = error.message || "Failed to update one-time block";
      return rejectWithValue(message);
    }
  }
);

export const deleteOnetimeBlock = createAsyncThunk<
  void,
  string, // blockId
  { rejectValue: string }
>(
  "availability/deleteOnetimeBlock",
  async (blockId, { dispatch, rejectWithValue }) => {
    try {
      await availabilityAPI.onetimeBlocks.delete(blockId);
      dispatch(closeOnetimeBlockModal());
    } catch (error: any) {
      const message = error.message || "Failed to delete one-time block";
      return rejectWithValue(message);
    }
  }
);

// Availability Check Thunk
export const checkAvailability = createAsyncThunk<
  AvailabilityResponse[],
  AvailabilityRequest,
  { rejectValue: string }
>("availability/checkAvailability", async (request, { rejectWithValue }) => {
  try {
    const response = await availabilityAPI.availability.check(request);
    return response;
  } catch (error: any) {
    const message = error.message || "Failed to check availability";
    return rejectWithValue(message);
  }
});

// Employee Availability Data Thunk
export const fetchEmployeeAvailabilityByDate = createAsyncThunk<
  void,
  EmployeeAvailabilityRequest,
  { rejectValue: string }
>(
  "availability/fetchEmployeeAvailabilityByDate",
  async (request, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setEmployeeAvailabilityLoading(true));
      const response =
        await availabilityAPI.availability.getEmployeeAvailability(request);
      dispatch(setEmployeeAvailability(response));
    } catch (error: any) {
      const message = error.message || "Failed to fetch employee availability";
      dispatch(setEmployeeAvailabilityError(message));
      return rejectWithValue(message);
    }
  }
);

// Fetch all data for an employee
export const fetchEmployeeAvailabilityData = createAsyncThunk<
  void,
  string, // employeeId
  { rejectValue: string }
>(
  "availability/fetchEmployeeAvailabilityData",
  async (employeeId, { dispatch, rejectWithValue }) => {
    try {
      // Fetch all data in parallel
      await Promise.all([
        dispatch(fetchSchedules(employeeId)),
        dispatch(fetchRecurringBreaks(employeeId)),
        dispatch(fetchOnetimeBlocks(employeeId)),
      ]);
    } catch (error: any) {
      const message =
        error.message || "Failed to fetch employee availability data";
      return rejectWithValue(message);
    }
  }
);
