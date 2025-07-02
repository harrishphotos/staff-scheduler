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
} from "../types/availability";
import axiosInstance from "../api/axios";

export const availabilityAPI = {
  // Schedule Management
  schedules: {
    // Get schedules with optional filtering
    getAll: async (
      employeeId?: string,
      dayOfWeek?: number
    ): Promise<Schedule[]> => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (dayOfWeek !== undefined)
        params.append("dayofweek", dayOfWeek.toString());

      const { data } = await axiosInstance.get<Schedule[]>(
        `/api/schedules?${params}`
      );
      return data;
    },

    // Create new schedule
    create: async (schedule: CreateScheduleRequest): Promise<Schedule> => {
      const { data } = await axiosInstance.post<Schedule>(
        "/api/schedules",
        schedule
      );
      return data;
    },

    // Get schedules for specific employee
    getByEmployee: async (employeeId: string): Promise<Schedule[]> => {
      return availabilityAPI.schedules.getAll(employeeId);
    },

    // Delete schedule
    delete: async (scheduleId: string): Promise<void> => {
      await axiosInstance.delete(`/api/schedules/${scheduleId}`);
    },
  },

  // Recurring Break Management
  recurringBreaks: {
    // Get recurring breaks with optional filtering
    getAll: async (
      employeeId?: string,
      dayOfWeek?: number
    ): Promise<RecurringBreak[]> => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (dayOfWeek !== undefined)
        params.append("dayofweek", dayOfWeek.toString());

      const { data } = await axiosInstance.get<RecurringBreak[]>(
        `/api/recurring-breaks?${params}`
      );
      return data;
    },

    // Create new recurring break
    create: async (
      breakData: CreateRecurringBreakRequest
    ): Promise<RecurringBreak> => {
      const { data } = await axiosInstance.post<RecurringBreak>(
        "/api/recurring-breaks",
        breakData
      );
      return data;
    },

    // Get recurring breaks for specific employee
    getByEmployee: async (employeeId: string): Promise<RecurringBreak[]> => {
      return availabilityAPI.recurringBreaks.getAll(employeeId);
    },

    // Delete recurring break
    delete: async (breakId: string): Promise<void> => {
      await axiosInstance.delete(`/api/recurring-breaks/${breakId}`);
    },
  },

  // One-time Block Management
  onetimeBlocks: {
    // Get one-time blocks with optional filtering
    getAll: async (
      employeeId?: string,
      startDate?: string,
      endDate?: string
    ): Promise<OnetimeBlock[]> => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const { data } = await axiosInstance.get<OnetimeBlock[]>(
        `/api/onetime-blocks?${params}`
      );
      return data;
    },

    // Create new one-time block
    create: async (
      blockData: CreateOnetimeBlockRequest
    ): Promise<OnetimeBlock> => {
      const { data } = await axiosInstance.post<OnetimeBlock>(
        "/api/onetime-blocks",
        blockData
      );
      return data;
    },

    // Get one-time blocks for specific employee
    getByEmployee: async (employeeId: string): Promise<OnetimeBlock[]> => {
      return availabilityAPI.onetimeBlocks.getAll(employeeId);
    },

    // Update one-time block
    update: async (
      blockId: string,
      blockData: CreateOnetimeBlockRequest
    ): Promise<OnetimeBlock> => {
      const { data } = await axiosInstance.put<OnetimeBlock>(
        `/api/onetime-blocks/${blockId}`,
        blockData
      );
      return data;
    },

    // Delete one-time block
    delete: async (blockId: string): Promise<void> => {
      await axiosInstance.delete(`/api/onetime-blocks/${blockId}`);
    },
  },

  // Availability Checking
  availability: {
    // Check employee availability for services and time range (legacy)
    check: async (
      request: AvailabilityRequest
    ): Promise<AvailabilityResponse[]> => {
      const { data } = await axiosInstance.post<AvailabilityResponse[]>(
        "/api/employees/availability",
        request
      );
      return data;
    },

    // Get employee availability data for a specific date (new)
    getEmployeeAvailability: async (
      request: EmployeeAvailabilityRequest
    ): Promise<EmployeeAvailabilityResponse> => {
      const { data } = await axiosInstance.post<EmployeeAvailabilityResponse>(
        "/api/availability",
        request
      );
      return data;
    },
  },
};

// Helper functions for data transformation
export const availabilityHelpers = {
  // Convert time string to 24-hour format
  formatTime: (timeString: string): string => {
    // Handle backend format: "0000-01-01T08:00:00Z" -> "08:00"
    if (timeString.includes("T")) {
      const timePart = timeString.split("T")[1];
      return timePart.slice(0, 5); // Get HH:MM
    }
    // Handle other formats
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Convert date to YYYY-MM-DD format
  formatDate: (date: Date): string => {
    return date.toISOString().split("T")[0];
  },

  // Convert datetime to RFC3339 format
  formatDateTime: (date: Date): string => {
    return date.toISOString();
  },

  // Group schedules by day of week
  groupSchedulesByDay: (schedules: Schedule[]) => {
    return schedules.reduce((groups, schedule) => {
      const day = schedule.day_of_week;
      if (!groups[day]) groups[day] = [];
      groups[day].push(schedule);
      return groups;
    }, {} as { [key: number]: Schedule[] });
  },

  // Group recurring breaks by day of week
  groupBreaksByDay: (breaks: RecurringBreak[]) => {
    return breaks.reduce((groups, breakItem) => {
      const day = breakItem.day_of_week;
      if (!groups[day]) groups[day] = [];
      groups[day].push(breakItem);
      return groups;
    }, {} as { [key: number]: RecurringBreak[] });
  },
};
