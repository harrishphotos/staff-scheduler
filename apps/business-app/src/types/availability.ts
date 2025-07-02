// Types for Staff Availability Management
// These correspond to the backend models in employee-service

export interface Schedule {
  id: string;
  employee_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  valid_from: string; // YYYY-MM-DD format
  valid_until?: string; // YYYY-MM-DD format (nullable)
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringBreak {
  id: string;
  employee_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface OnetimeBlock {
  id: string;
  employee_id: string;
  start_date_time: string; // ISO string
  end_date_time: string; // ISO string
  reason: string;
  created_at: string;
  updated_at: string;
}

// API Request types
export interface CreateScheduleRequest {
  employee_id: string;
  day_of_week?: number; // Optional for one-time schedules
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_until?: string;
  notes?: string;
}

export interface CreateRecurringBreakRequest {
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface CreateOnetimeBlockRequest {
  employee_id: string;
  start_date_time: string;
  end_date_time: string;
  reason: string;
}

// UI Helper types
export interface WeeklySchedule {
  [key: number]: Schedule[]; // day_of_week -> schedules
}

export interface DayOfWeekInfo {
  value: number;
  label: string;
  short: string;
}

export const DAYS_OF_WEEK: DayOfWeekInfo[] = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

// Availability checking types (legacy - for service booking)
export interface AvailabilityRequest {
  service: string[];
  starttime: string; // RFC3339 format
  endtime: string; // RFC3339 format
}

export interface AvailabilityResponse {
  employeeid: string;
  service: string[];
  EWT: string[]; // Effective Working Time slots
}

// Employee Availability Data types (new - for staff management)
export interface EmployeeAvailabilityRequest {
  date: string; // YYYY-MM-DD format
  employee_id: string; // UUID string
}

export interface EmployeeAvailabilitySchedule {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
}

export interface EmployeeAvailabilityBlock {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  reason: string;
}

export interface EmployeeAvailabilityBreak {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  reason: string;
}

export interface EmployeeAvailabilityResponse {
  date: string; // ISO date
  employee_id: string; // UUID string
  schedule: EmployeeAvailabilitySchedule | null;
  onetimeblocks: EmployeeAvailabilityBlock[];
  breaks: EmployeeAvailabilityBreak[];
}
