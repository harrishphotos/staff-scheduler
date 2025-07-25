import React, { useState, useEffect } from "react";
import { Coffee, Clock } from "lucide-react";
import {
  RecurringBreak,
  CreateRecurringBreakRequest,
  DAYS_OF_WEEK,
} from "../../../../types/availability";
import { availabilityHelpers } from "../../../../utils/availabilityApi";

interface RecurringBreakFormProps {
  initialData?: RecurringBreak | null;
  employeeId: string;
  onSubmit: (breakData: CreateRecurringBreakRequest) => void;
  onDelete?: (breakId: string) => void;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
}

const RecurringBreakForm: React.FC<RecurringBreakFormProps> = ({
  initialData,
  employeeId,
  onSubmit,
  onDelete,
  loading,
  error,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateRecurringBreakRequest>({
    employee_id: employeeId,
    day_of_week: 1, // Monday default
    start_time: "12:00:00",
    end_time: "13:00:00",
    reason: "Lunch Break",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      // Convert backend time format to form format
      const formatTimeForForm = (timeString: string) => {
        if (timeString.includes("T")) {
          const timePart = timeString.split("T")[1];
          return timePart.slice(0, 8); // Get HH:MM:SS
        }
        return timeString;
      };

      setFormData({
        employee_id: initialData.employee_id,
        day_of_week: initialData.day_of_week,
        start_time: formatTimeForForm(initialData.start_time),
        end_time: formatTimeForForm(initialData.end_time),
        reason: initialData.reason,
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate times
    if (!formData.start_time) {
      newErrors.start_time = "Start time is required";
    }

    if (!formData.end_time) {
      newErrors.end_time = "End time is required";
    }

    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}`);
      const endTime = new Date(`2000-01-01T${formData.end_time}`);

      if (startTime >= endTime) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    // Validate reason
    if (!formData.reason.trim()) {
      newErrors.reason = "Break reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "day_of_week" ? parseInt(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Generate time options for select inputs
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour < 22; hour++) {
      // 6 AM to 10 PM
      for (let minute = 0; minute < 60; minute += 15) {
        // 15-minute intervals
        const time = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}:00`;
        const display = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push({ value: time, display });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Common break reasons
  const commonReasons = [
    "Lunch Break",
    "Coffee Break",
    "Afternoon Break",
    "Morning Break",
    "Personal Break",
    "Rest Break",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">Error</h3>
              <div className="mt-2 text-sm text-red-300">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Day of Week */}
      <div>
        <label
          htmlFor="day_of_week"
          className="text-white/70 text-sm font-medium"
        >
          Day of Week
        </label>
        <div className="relative mt-1.5">
          <select
            id="day_of_week"
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
            required
          >
            {DAYS_OF_WEEK.map((day) => (
              <option
                key={day.value}
                value={day.value}
                className="bg-gray-800 text-white"
              >
                {day.label}
              </option>
            ))}
          </select>
          <Coffee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        {errors.day_of_week && (
          <p className="mt-1 text-sm text-red-400">{errors.day_of_week}</p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="start_time"
            className="text-white/70 text-sm font-medium"
          >
            Start Time
          </label>
          <div className="relative mt-1.5">
            <select
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              required
            >
              {timeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-gray-800 text-white"
                >
                  {option.display}
                </option>
              ))}
            </select>
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-400">{errors.start_time}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_time"
            className="text-white/70 text-sm font-medium"
          >
            End Time
          </label>
          <div className="relative mt-1.5">
            <select
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              required
            >
              {timeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-gray-800 text-white"
                >
                  {option.display}
                </option>
              ))}
            </select>
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-400">{errors.end_time}</p>
          )}
        </div>
      </div>

      {/* Break Reason */}
      <div>
        <label htmlFor="reason" className="text-white/70 text-sm font-medium">
          Break Reason
        </label>
        <div className="relative mt-1.5">
          <select
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
            required
          >
            {commonReasons.map((reason) => (
              <option
                key={reason}
                value={reason}
                className="bg-gray-800 text-white"
              >
                {reason}
              </option>
            ))}
          </select>
          <Coffee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        {errors.reason && (
          <p className="mt-1 text-sm text-red-400">{errors.reason}</p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-white/15">
        {/* Delete Button (only show in edit mode) */}
        {initialData && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-400/30 rounded-lg hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Delete Break
          </button>
        )}

        <div className="flex space-x-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-white/95 hover:bg-white/85 disabled:bg-white/50 text-black font-medium py-2.5 px-6 rounded-lg transition-colors duration-150 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              "Save Break"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RecurringBreakForm;
