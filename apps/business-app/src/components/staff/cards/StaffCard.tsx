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
      className={`bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm flex flex-col transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl group ${
        !isActive ? "opacity-60" : ""
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            {profilePic ? (
              <img
                src={profilePic}
                alt={`${firstName} ${lastName}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/20 ring-2 ring-white/10"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white/90 flex items-center justify-center font-bold text-xl backdrop-blur-sm">
                {getInitials(firstName, lastName)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white/95">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-white/60">{role}</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
              isActive
                ? "bg-green-500/20 border border-green-400/30 text-green-400"
                : "bg-red-500/20 border border-red-400/30 text-red-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
              Email
            </label>
            <p className="text-sm text-white/80 mt-1">{email}</p>
          </div>
          {services && services.length > 0 && (
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Services
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {services.slice(0, 2).map((service, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-white/10 border border-white/20 text-white/80 rounded-md"
                  >
                    {service}
                  </span>
                ))}
                {services.length > 2 && (
                  <span className="px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/60 rounded-md">
                    +{services.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-t border-white/10">
        <button
          onClick={handleManageAvailability}
          className="w-full bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 group-hover:shadow-lg"
        >
          <FiCalendar className="w-4 h-4" />
          <span>Manage Availability</span>
        </button>
      </div>

      <div className="bg-white/5 px-6 py-4 border-t border-white/10 mt-auto rounded-b-xl flex justify-between items-center">
        <p className="text-xs text-white/50">
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
            className="p-2 text-white/50 hover:text-white/80 rounded-md hover:bg-white/10 transition-all duration-200"
            title="Edit"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleStatus(id, !isActive)}
            className={`p-2 rounded-md hover:bg-white/10 transition-all duration-200 ${
              isActive
                ? "text-white/50 hover:text-red-400"
                : "text-white/50 hover:text-green-400"
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
