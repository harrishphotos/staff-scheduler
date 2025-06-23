import React from "react";
import { useNavigate } from "react-router-dom";
import { Staff } from "../../../types/staff";
import {
  FiEdit,
  FiToggleLeft,
  FiToggleRight,
  FiCalendar,
} from "react-icons/fi";

interface StaffCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  onEdit,
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  const {
    id,
    firstName,
    lastName,
    role,
    email,
    isActive,
    createdAt,
    profilePic,
    services,
  } = staff;

  const getInitials = (name1: string, name2: string) => {
    return `${name1?.charAt(0) ?? ""}${name2?.charAt(0) ?? ""}`.toUpperCase();
  };

  const handleManageAvailability = () => {
    navigate(`/staff/${id}/availability`);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 hover:shadow-lg ${
        !isActive ? "bg-gray-50/50 dark:bg-gray-800/50" : ""
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {profilePic ? (
              <img
                src={profilePic}
                alt={`${firstName} ${lastName}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl border-2 border-white dark:border-gray-800 ring-2 ring-gray-100 dark:ring-gray-700">
                {getInitials(firstName, lastName)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{role}</p>
            </div>
          </div>
          <div
            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
              isActive
                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
              Email
            </p>
            <a
              href={`mailto:${email}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {email}
            </a>
          </div>
          {services && services.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                Services
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {services.map((service, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manage Availability Button */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleManageAvailability}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
        >
          <FiCalendar className="w-4 h-4" />
          <span>Manage Availability</span>
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 mt-auto rounded-b-xl flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Joined:{" "}
          {createdAt
            ? new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(staff)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Edit"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleStatus(id, !isActive)}
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isActive
                ? "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
            }`}
            title={isActive ? "Deactivate" : "Activate"}
          >
            {isActive ? (
              <FiToggleLeft className="w-5 h-5" />
            ) : (
              <FiToggleRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffCard;
