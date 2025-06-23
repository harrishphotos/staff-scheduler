import React, { useState, useEffect } from "react";
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
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
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day of Week */}
      <div>
        <label
          htmlFor="day_of_week"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Day of Week
        </label>
        <select
          id="day_of_week"
          name="day_of_week"
          value={formData.day_of_week}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          required
        >
          {DAYS_OF_WEEK.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        {errors.day_of_week && (
          <p className="mt-1 text-sm text-red-600">{errors.day_of_week}</p>
        )}
      </div>

      {/* Break Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Break Type/Reason
        </label>
        <input
          type="text"
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          list="break-reason-suggestions"
          placeholder="Type or select a break reason..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          required
        />
        <datalist id="break-reason-suggestions">
          {commonReasons.map((reason) => (
            <option key={reason} value={reason} />
          ))}
        </datalist>
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You can type a custom break reason or select from suggestions
        </p>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="start_time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Start Time
          </label>
          <select
            id="start_time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            required
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.display}
              </option>
            ))}
          </select>
          {errors.start_time && (
            <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            End Time
          </label>
          <select
            id="end_time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            required
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.display}
              </option>
            ))}
          </select>
          {errors.end_time && (
            <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
          )}
        </div>
      </div>

      {/* Duration Info */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm">
            <p className="text-orange-800 dark:text-orange-200 font-medium">
              Break Duration
            </p>
            <p className="text-orange-700 dark:text-orange-300">
              {formData.start_time &&
                formData.end_time &&
                (() => {
                  const start = new Date(`2000-01-01T${formData.start_time}`);
                  const end = new Date(`2000-01-01T${formData.end_time}`);
                  const diff = end.getTime() - start.getTime();
                  const minutes = Math.floor(diff / (1000 * 60));

                  if (minutes <= 0) return "Invalid time range";
                  if (minutes < 60) return `${minutes} minutes`;

                  const hours = Math.floor(minutes / 60);
                  const remainingMinutes = minutes % 60;

                  if (remainingMinutes === 0)
                    return `${hours} hour${hours > 1 ? "s" : ""}`;
                  return `${hours} hour${
                    hours > 1 ? "s" : ""
                  } ${remainingMinutes} minute${
                    remainingMinutes > 1 ? "s" : ""
                  }`;
                })()}
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
        {/* Delete Button (only show in edit mode) */}
        {initialData && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Delete Break
          </button>
        )}

        <div className="flex space-x-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            )}
            <span>{loading ? "Saving..." : "Save Break"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default RecurringBreakForm;
