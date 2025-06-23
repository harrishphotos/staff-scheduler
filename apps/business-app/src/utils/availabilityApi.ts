import {
  Schedule,
  RecurringBreak,
  OnetimeBlock,
  CreateScheduleRequest,
  CreateRecurringBreakRequest,
  CreateOnetimeBlockRequest,
  AvailabilityRequest,
  AvailabilityResponse,
} from "../types/availability";

const EMPLOYEE_API_BASE = "http://localhost:3002";

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

      const response = await fetch(`${EMPLOYEE_API_BASE}/schedules?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      return response.json();
    },

    // Create new schedule
    create: async (schedule: CreateScheduleRequest): Promise<Schedule> => {
      const response = await fetch(`${EMPLOYEE_API_BASE}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create schedule");
      }
      return response.json();
    },

    // Get schedules for specific employee
    getByEmployee: async (employeeId: string): Promise<Schedule[]> => {
      return availabilityAPI.schedules.getAll(employeeId);
    },

    // Delete schedule
    delete: async (scheduleId: string): Promise<void> => {
      const response = await fetch(
        `${EMPLOYEE_API_BASE}/schedules/${scheduleId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete schedule");
      }
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

      const response = await fetch(
        `${EMPLOYEE_API_BASE}/recurring-breaks?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recurring breaks");
      }
      return response.json();
    },

    // Create new recurring break
    create: async (
      breakData: CreateRecurringBreakRequest
    ): Promise<RecurringBreak> => {
      const response = await fetch(`${EMPLOYEE_API_BASE}/recurring-breaks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breakData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create recurring break");
      }
      return response.json();
    },

    // Get recurring breaks for specific employee
    getByEmployee: async (employeeId: string): Promise<RecurringBreak[]> => {
      return availabilityAPI.recurringBreaks.getAll(employeeId);
    },

    // Delete recurring break
    delete: async (breakId: string): Promise<void> => {
      const response = await fetch(
        `${EMPLOYEE_API_BASE}/recurring-breaks/${breakId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete recurring break");
      }
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

      const response = await fetch(
        `${EMPLOYEE_API_BASE}/onetime-blocks?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch one-time blocks");
      }
      return response.json();
    },

    // Create new one-time block
    create: async (
      blockData: CreateOnetimeBlockRequest
    ): Promise<OnetimeBlock> => {
      const response = await fetch(`${EMPLOYEE_API_BASE}/onetime-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create one-time block");
      }
      return response.json();
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
      const response = await fetch(
        `${EMPLOYEE_API_BASE}/onetime-blocks/${blockId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blockData),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update one-time block");
      }
      return response.json();
    },

    // Delete one-time block
    delete: async (blockId: string): Promise<void> => {
      const response = await fetch(
        `${EMPLOYEE_API_BASE}/onetime-blocks/${blockId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete one-time block");
      }
    },
  },

  // Availability Checking
  availability: {
    // Check employee availability for services and time range
    check: async (
      request: AvailabilityRequest
    ): Promise<AvailabilityResponse[]> => {
      const response = await fetch(
        `${EMPLOYEE_API_BASE}/employees/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to check availability");
      }
      return response.json();
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
