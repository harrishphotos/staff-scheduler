import React, { useState, useEffect } from "react";
import {
  OnetimeBlock,
  CreateOnetimeBlockRequest,
} from "../../../../types/availability";

interface OnetimeBlockFormProps {
  initialData?: OnetimeBlock | null;
  employeeId: string;
  onSubmit: (blockData: CreateOnetimeBlockRequest) => void;
  onDelete?: () => void;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
}

const OnetimeBlockForm: React.FC<OnetimeBlockFormProps> = ({
  initialData,
  employeeId,
  onSubmit,
  onDelete,
  loading,
  error,
  onCancel,
}) => {
  // Initialize with today's date at 9 AM and 5 PM
  const today = new Date();
  const defaultStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    9,
    0
  );
  const defaultEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    17,
    0
  );

  const [formData, setFormData] = useState<CreateOnetimeBlockRequest>({
    employee_id: employeeId,
    start_date_time: defaultStart.toISOString().slice(0, 16), // Format for datetime-local input
    end_date_time: defaultEnd.toISOString().slice(0, 16),
    reason: "Vacation",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to convert ISO string to datetime-local format
  const formatDateTimeForInput = (isoString: string): string => {
    const date = new Date(isoString);
    // Adjust for timezone offset to get local time
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return localDate.toISOString().slice(0, 16);
  };

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        employee_id: initialData.employee_id,
        start_date_time: formatDateTimeForInput(initialData.start_date_time),
        end_date_time: formatDateTimeForInput(initialData.end_date_time),
        reason: initialData.reason,
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate start date/time
    if (!formData.start_date_time) {
      newErrors.start_date_time = "Start date and time is required";
    }

    // Validate end date/time
    if (!formData.end_date_time) {
      newErrors.end_date_time = "End date and time is required";
    }

    // Validate date range
    if (formData.start_date_time && formData.end_date_time) {
      const startDate = new Date(formData.start_date_time);
      const endDate = new Date(formData.end_date_time);

      if (startDate >= endDate) {
        newErrors.end_date_time = "End date/time must be after start date/time";
      }

      // Check if start date is in the past (optional warning)
      const now = new Date();
      if (startDate < now) {
        // Allow past dates but could show a warning in a real app
      }
    }

    // Validate reason
    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert datetime-local format back to ISO string
      const submitData: CreateOnetimeBlockRequest = {
        ...formData,
        start_date_time: new Date(formData.start_date_time).toISOString(),
        end_date_time: new Date(formData.end_date_time).toISOString(),
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Common time-off reasons
  const commonReasons = [
    "Vacation",
    "Sick Leave",
    "Personal Time",
    "Family Emergency",
    "Medical Appointment",
    "Bereavement",
    "Maternity/Paternity Leave",
    "Conference/Training",
    "Other",
  ];

  // Get all reasons including the current one if it's not in the predefined list
  const getAllReasons = () => {
    const reasons = [...commonReasons];
    if (formData.reason && !commonReasons.includes(formData.reason)) {
      reasons.splice(-1, 0, formData.reason); // Insert before "Other"
    }
    return reasons;
  };

  // Calculate duration
  const calculateDuration = () => {
    if (!formData.start_date_time || !formData.end_date_time) return "";

    const start = new Date(formData.start_date_time);
    const end = new Date(formData.end_date_time);
    const diffMs = end.getTime() - start.getTime();

    if (diffMs <= 0) return "Invalid date range";

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 1) {
      return `${diffDays} days`;
    } else if (diffHours >= 1) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""}${
        diffMinutes > 0 ? ` ${diffMinutes} min` : ""
      }`;
    } else {
      return `${diffMinutes} minutes`;
    }
  };

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

      {/* Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Reason for Time Off
        </label>
        <input
          type="text"
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          list="reason-suggestions"
          placeholder="Type or select a reason..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
          required
        />
        <datalist id="reason-suggestions">
          {commonReasons.map((reason) => (
            <option key={reason} value={reason} />
          ))}
        </datalist>
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You can type a custom reason or select from suggestions
        </p>
      </div>

      {/* DateTime Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="start_date_time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            id="start_date_time"
            name="start_date_time"
            value={formData.start_date_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            required
          />
          {errors.start_date_time && (
            <p className="mt-1 text-sm text-red-600">
              {errors.start_date_time}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_date_time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            End Date & Time
          </label>
          <input
            type="datetime-local"
            id="end_date_time"
            name="end_date_time"
            value={formData.end_date_time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            required
          />
          {errors.end_date_time && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date_time}</p>
          )}
        </div>
      </div>

      {/* Duration Info */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div className="text-sm">
            <p className="text-red-800 dark:text-red-200 font-medium">
              Time Off Duration
            </p>
            <p className="text-red-700 dark:text-red-300">
              {calculateDuration()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Duration Buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Duration
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Half Day", hours: 4 },
            { label: "Full Day", hours: 8 },
            { label: "2 Days", hours: 16 },
            { label: "1 Week", hours: 40 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                const start = new Date(formData.start_date_time);
                const end = new Date(
                  start.getTime() + preset.hours * 60 * 60 * 1000
                );
                setFormData((prev) => ({
                  ...prev,
                  end_date_time: end.toISOString().slice(0, 16),
                }));
              }}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        {/* Delete Button (only show in edit mode) */}
        <div>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Delete Time Off
            </button>
          )}
        </div>

        {/* Cancel and Save Buttons */}
        <div className="flex space-x-3">
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
            <span>
              {loading
                ? "Saving..."
                : initialData
                ? "Update Time Off"
                : "Save Time Off"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default OnetimeBlockForm;
