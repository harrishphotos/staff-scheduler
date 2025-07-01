import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
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

      {/* Date & Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="start_date_time"
            className="text-white/70 text-sm font-medium"
          >
            Start Date & Time
          </label>
          <div className="relative mt-1.5">
            <input
              type="datetime-local"
              id="start_date_time"
              name="start_date_time"
              value={formData.start_date_time}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              required
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.start_date_time && (
            <p className="mt-1 text-sm text-red-400">
              {errors.start_date_time}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_date_time"
            className="text-white/70 text-sm font-medium"
          >
            End Date & Time
          </label>
          <div className="relative mt-1.5">
            <input
              type="datetime-local"
              id="end_date_time"
              name="end_date_time"
              value={formData.end_date_time}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              required
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.end_date_time && (
            <p className="mt-1 text-sm text-red-400">{errors.end_date_time}</p>
          )}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="text-white/70 text-sm font-medium">
          Reason for Time Off
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
            {getAllReasons().map((reason) => (
              <option
                key={reason}
                value={reason}
                className="bg-gray-800 text-white"
              >
                {reason}
              </option>
            ))}
          </select>
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        {errors.reason && (
          <p className="mt-1 text-sm text-red-400">{errors.reason}</p>
        )}
      </div>

      {/* Duration Display */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 text-white/50 mr-2" />
          <div className="text-sm">
            <p className="text-white/70 font-medium">Duration</p>
            <p className="text-white/90">{calculateDuration()}</p>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-white/15">
        {/* Delete Button (only show in edit mode) */}
        {initialData && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-400/30 rounded-lg hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Delete Time Off
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
              "Save Time Off"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OnetimeBlockForm;
