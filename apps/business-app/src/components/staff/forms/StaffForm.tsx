import React, { useState, useEffect } from "react";
import { Staff } from "../../../types/staff";
import { User, Mail, UserCog, Image, Eye, Loader2 } from "lucide-react";

interface StaffFormProps {
  initialData?: Staff | null;
  onSubmit: (staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">) => void;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
}

const StaffForm: React.FC<StaffFormProps> = ({
  initialData,
  onSubmit,
  loading,
  error,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePic: "",
    role: "",
    isActive: true,
    services: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        profilePic: initialData.profilePic || "",
        role: initialData.role,
        isActive: initialData.isActive,
        services: initialData.services || [],
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
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
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const predefinedRoles = [
    "Stylist",
    "Barber",
    "Colorist",
    "Makeup Artist",
    "Manager",
    "Receptionist",
    "Nail Technician",
    "Massage Therapist",
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

      {/* First Name & Last Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="firstName"
            className="text-white/70 text-sm font-medium"
          >
            First Name
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              placeholder="Enter first name"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="text-white/70 text-sm font-medium"
          >
            Last Name
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
              placeholder="Enter last name"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-white/70 text-sm font-medium">
          Email Address
        </label>
        <div className="relative mt-1.5">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
            placeholder="Enter email address"
            required
          />
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role" className="text-white/70 text-sm font-medium">
          Role
        </label>
        <div className="relative mt-1.5">
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            list="roles"
            className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
            placeholder="Enter or select role"
            required
          />
          <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        <datalist id="roles">
          {predefinedRoles.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>
        {errors.role && (
          <p className="mt-1 text-sm text-red-400">{errors.role}</p>
        )}
      </div>

      {/* Profile Picture URL */}
      <div>
        <label
          htmlFor="profilePic"
          className="text-white/70 text-sm font-medium"
        >
          Profile Picture URL
        </label>
        <div className="relative mt-1.5">
          <input
            type="url"
            id="profilePic"
            name="profilePic"
            value={formData.profilePic}
            onChange={handleChange}
            className="pl-10 h-10 w-full bg-white/5 border border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 rounded-lg transition-colors duration-150"
            placeholder="https://example.com/image.jpg"
          />
          <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
        </div>
        <p className="mt-1 text-sm text-white/50">
          Optional: Provide a URL for the profile picture
        </p>
      </div>

      {/* Active Status */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-white/90 focus:ring-white/20 border-white/20 rounded bg-white/5"
          />
          <label htmlFor="isActive" className="ml-3 text-sm text-white/80">
            Active Status
          </label>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Staff member is currently working and available for scheduling
        </p>
      </div>

      {/* Preview Profile Picture */}
      {formData.profilePic && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Preview
          </label>
          <div className="flex items-center space-x-3">
            <img
              src={formData.profilePic}
              alt="Profile preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="text-white/60 text-sm">Profile picture preview</div>
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-white/15">
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
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>{initialData ? "Updating..." : "Creating..."}</span>
            </>
          ) : initialData ? (
            "Update Staff"
          ) : (
            "Create Staff"
          )}
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
