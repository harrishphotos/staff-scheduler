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
import StaffHeader from "../components/staff/StaffHeader";
import StaffGrid from "../components/staff/views/StaffGrid";
import StaffModal from "../components/staff/modals/StaffModal";
import toast from "react-hot-toast";

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

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleFilterChange = (filter: "all" | "active" | "inactive") => {
    setFilterStatus(filter);
  };

  // Show loading screen if still fetching initial data
  if (loading && staffList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4">
            Loading Staff...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Fetching staff data from API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <StaffHeader
          onAddStaff={handleAddStaff}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          totalCount={stats.totalCount}
          activeCount={stats.activeCount}
        />

        {/* Staff Grid Section */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Results Info */}
          {searchTerm || filterStatus !== "all" ? (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
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
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
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
