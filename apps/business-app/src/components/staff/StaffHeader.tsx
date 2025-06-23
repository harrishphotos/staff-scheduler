import React, { useState } from "react";

interface StaffHeaderProps {
  onAddStaff: () => void;
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filter: "all" | "active" | "inactive") => void;
  totalCount: number;
  activeCount: number;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({
  onAddStaff,
  onSearch,
  onFilterChange,
  totalCount,
  activeCount,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Staff Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your team members and their information
          </p>
        </div>
        <button
          onClick={onAddStaff}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Add Staff</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                Total Staff
              </p>
              <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-300">
                Active Staff
              </p>
              <p className="text-2xl font-semibold text-green-900 dark:text-green-100">
                {activeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-300">
                Inactive Staff
              </p>
              <p className="text-2xl font-semibold text-red-900 dark:text-red-100">
                {totalCount - activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeFilter === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange("active")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeFilter === "active"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange("inactive")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeFilter === "inactive"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffHeader;
