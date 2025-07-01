import React from "react";
import { Staff } from "../../../types/staff";
import StaffCard from "../cards/StaffCard";

interface StaffGridProps {
  staff: Staff[];
  loading: boolean;
  onEdit: (staff: Staff) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

const StaffGrid: React.FC<StaffGridProps> = ({
  staff,
  loading,
  onEdit,
  onToggleStatus,
}) => {
  // Loading skeleton
  if (loading && staff.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm animate-pulse"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/10 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-white/10 rounded w-full"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="h-6 bg-white/10 rounded w-16"></div>
              <div className="h-6 bg-white/10 rounded w-20"></div>
            </div>

            <div className="bg-white/5 -mx-6 -mb-6 mt-6 px-6 py-4 border-t border-white/10 flex justify-between items-center rounded-b-xl">
              <div className="h-4 w-28 bg-white/10 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white/10 rounded-md"></div>
                <div className="w-9 h-9 bg-white/10 rounded-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
          <svg
            className="w-12 h-12 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white/95 mb-2">
          No staff members found
        </h3>
        <p className="text-white/60 mb-6">
          Get started by adding your first staff member.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {staff.map((staffMember) => (
        <StaffCard
          key={staffMember.id}
          staff={staffMember}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
};

export default StaffGrid;
