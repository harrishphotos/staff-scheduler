import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import {
  selectStaffState,
  selectStaffStateStatus,
  selectStaffModalState,
  openAddModal,
  openEditModal,
  closeModal,
} from "../store/slices/staffSlice";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
} from "../store/thunks/staffThunk";
import { Staff } from "../types/staff";
import StaffGrid from "../components/staff/views/StaffGrid";
import StaffModal from "../components/staff/modals/StaffModal";
import toast from "react-hot-toast";
import { FiPlus, FiSearch } from "react-icons/fi";

const StaffManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const { staffList } = useSelector(selectStaffState);
  const { isStaffFetched, loading, error } = useSelector(
    selectStaffStateStatus
  );
  const { isModalOpen, modalMode, selectedStaff } = useSelector(
    selectStaffModalState
  );

  // Local state for filtering and searching
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Fetch staff data on component mount
  useEffect(() => {
    console.log("🔄 StaffManagement mounted, fetching staff...");
    dispatch(fetchStaff());
  }, [dispatch]);

  // Show toast notifications for errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Debug logging
  useEffect(() => {
    console.log("📊 Staff state updated:", {
      staffCount: staffList.length,
      isStaffFetched,
      loading,
      error,
    });
  }, [staffList, isStaffFetched, loading, error]);

  // Filter and search staff
  const filteredStaff = useMemo(() => {
    let filtered = [...staffList];

    // Apply status filter
    if (filterStatus === "active") {
      filtered = filtered.filter((staff) => staff.isActive);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((staff) => !staff.isActive);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (staff) =>
          staff.firstName.toLowerCase().includes(searchLower) ||
          staff.lastName.toLowerCase().includes(searchLower) ||
          staff.email.toLowerCase().includes(searchLower) ||
          staff.role.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [staffList, filterStatus, searchTerm]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      totalCount: staffList.length,
      activeCount: staffList.filter((staff) => staff.isActive).length,
    }),
    [staffList]
  );

  // Handlers
  const handleAddStaff = () => {
    dispatch(openAddModal());
  };

  const handleEditStaff = (staff: Staff) => {
    dispatch(openEditModal(staff));
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleSubmitStaff = async (
    staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (modalMode === "add") {
        await dispatch(createStaff(staffData)).unwrap();
        toast.success("Staff member created successfully!");
      } else if (selectedStaff) {
        await dispatch(
          updateStaff({
            id: selectedStaff.id,
            updates: staffData,
          })
        ).unwrap();
        toast.success("Staff member updated successfully!");
      }
    } catch (error: any) {
      toast.error(error || "An error occurred while saving staff member");
    }
  };

  const handleToggleStaffStatus = async (id: string, isActive: boolean) => {
    try {
      await dispatch(toggleStaffStatus({ id, isActive })).unwrap();
      toast.success(
        `Staff member ${isActive ? "activated" : "deactivated"} successfully!`
      );
    } catch (error: any) {
      toast.error(error || "An error occurred while updating staff status");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setFilterStatus(filter);
  };

  return (
    <div className="p-6">
      <div className="max-w-none mx-auto">
        {/* Header Section */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white/95 mb-2">
                Staff Scheduler
              </h1>
              <p className="text-white/60">
                Manage your team members and their information
              </p>
            </div>
            <button
              onClick={handleAddStaff}
              className="mt-4 sm:mt-0 bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-400">
                    Total Staff
                  </p>
                  <p className="text-2xl font-semibold text-white/95">
                    {stats.totalCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-400"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-400">
                    Active Staff
                  </p>
                  <p className="text-2xl font-semibold text-white/95">
                    {stats.activeCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
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
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-400">
                    Inactive Staff
                  </p>
                  <p className="text-2xl font-semibold text-white/95">
                    {stats.totalCount - stats.activeCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-white/50" />
                </div>
                <input
                  type="text"
                  placeholder="Search staff by name, email, or role..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white/90 placeholder:text-white/40 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  filterStatus === "all"
                    ? "bg-white/95 text-black border-white/95"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange("active")}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  filterStatus === "active"
                    ? "bg-white/95 text-black border-white/95"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterChange("inactive")}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
                  filterStatus === "inactive"
                    ? "bg-white/95 text-black border-white/95"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6">
          {/* Results Info */}
          {searchTerm || filterStatus !== "all" ? (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">
                    Showing {filteredStaff.length} of {staffList.length} staff
                    members
                    {searchTerm && <span> matching "{searchTerm}"</span>}
                    {filterStatus !== "all" && (
                      <span> with status: {filterStatus}</span>
                    )}
                  </p>
                </div>
                {(searchTerm || filterStatus !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                    }}
                    className="text-white/70 hover:text-white/90 text-sm font-medium transition-colors duration-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Staff Grid */}
          <StaffGrid
            staff={filteredStaff}
            loading={loading}
            onEdit={handleEditStaff}
            onToggleStatus={handleToggleStaffStatus}
          />
        </div>

        {/* Modal */}
        <StaffModal
          isOpen={isModalOpen}
          mode={modalMode}
          staff={selectedStaff}
          onClose={handleCloseModal}
          onSubmit={handleSubmitStaff}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default StaffManagement;
