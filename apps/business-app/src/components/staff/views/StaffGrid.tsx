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
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Loading skeleton cards */}
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 -mx-6 -mb-6 mt-6 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-b-xl">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
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
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No staff members found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
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
