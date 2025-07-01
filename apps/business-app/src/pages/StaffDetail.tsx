import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store";
import { Staff } from "../types/staff";
import { selectStaffState } from "../store/slices/staffSlice";
import {
  selectSelectedEmployee,
  selectActiveTab,
  selectLoadingStates,
  selectErrorStates,
  setSelectedEmployee,
  setActiveTab,
  clearAllErrors,
} from "../store/slices/availabilitySlice";
import { fetchEmployeeAvailabilityData } from "../store/thunks/availabilityThunk";
import { fetchStaff } from "../store/thunks/staffThunk";

// Tab Components (will be implemented next)
import StaffOverviewTab from "../components/staff/tabs/availability/StaffOverviewTab";
import SchedulesTab from "../components/staff/tabs/availability/SchedulesTab";
import RecurringBreaksTab from "../components/staff/tabs/availability/RecurringBreaksTab";
import OnetimeBlocksTab from "../components/staff/tabs/availability/OnetimeBlocksTab";

interface StaffDetailProps {}

const StaffDetail: React.FC<StaffDetailProps> = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const { staffList } = useSelector(selectStaffState);
  const selectedEmployeeId = useSelector(selectSelectedEmployee);
  const activeTab = useSelector(selectActiveTab);
  const loadingStates = useSelector(selectLoadingStates);
  const errorStates = useSelector(selectErrorStates);

  // Find the current staff member
  const staff = staffList.find((s) => s.id === staffId) || null;

  // Effect to initialize the component
  useEffect(() => {
    if (!staffId) {
      navigate("/staff");
      return;
    }

    // Set selected employee in availability slice
    if (selectedEmployeeId !== staffId) {
      dispatch(setSelectedEmployee(staffId));
    }

    // Fetch staff data if not available
    if (staffList.length === 0) {
      dispatch(fetchStaff());
    }

    // Fetch availability data for the employee
    dispatch(fetchEmployeeAvailabilityData(staffId));

    // Clear any existing errors
    dispatch(clearAllErrors());
  }, [staffId, selectedEmployeeId, staffList.length, dispatch, navigate]);

  // Tab configuration
  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      description: "Summary of all availability settings",
    },
    {
      id: "schedules" as const,
      label: "Work Schedules",
      description: "Manage work hours and schedules",
    },
    {
      id: "breaks" as const,
      label: "Recurring Breaks",
      description: "Manage regular breaks",
    },
    {
      id: "blocks" as const,
      label: "Time Off",
      description: "Manage time-off periods",
    },
  ];

  // Handle tab change
  const handleTabChange = (tabId: typeof activeTab) => {
    dispatch(setActiveTab(tabId));
  };

  // Handle back navigation
  const handleBackToStaff = () => {
    navigate("/staff");
  };

  // Loading state
  const isLoading = Object.values(loadingStates).some((loading) => loading);

  // Error state
  const hasErrors = Object.values(errorStates).some((error) => error !== null);

  if (!staffId) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-none mx-auto">
        {/* Header */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6 mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-white/60 mb-4">
            <button
              onClick={handleBackToStaff}
              className="hover:text-white/90 transition-colors"
            >
              Staff Management
            </button>
            <span className="mx-2">/</span>
            <span className="text-white/95">
              {staff ? `${staff.firstName} ${staff.lastName}` : "Loading..."}
            </span>
          </div>

          {/* Staff Info */}
          {staff && (
            <div className="flex items-center gap-6">
              {staff.profilePic ? (
                <img
                  src={staff.profilePic}
                  alt={`${staff.firstName} ${staff.lastName}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/20 ring-4 ring-white/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 text-white/90 flex items-center justify-center font-bold text-2xl backdrop-blur-sm">
                  {staff.firstName.charAt(0)}
                  {staff.lastName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white/95">
                  {staff.firstName} {staff.lastName}
                </h1>
                <p className="text-lg text-white/70 mt-1">{staff.role}</p>
                <p className="text-sm text-white/60 mt-1">{staff.email}</p>
                <div className="flex items-center mt-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${
                      staff.isActive
                        ? "bg-green-500/20 border border-green-400/30 text-green-400"
                        : "bg-red-500/20 border border-red-400/30 text-red-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        staff.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    {staff.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {hasErrors && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm">
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
                <h3 className="text-sm font-medium text-red-400">
                  Error loading availability data
                </h3>
                <div className="mt-2 text-sm text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    {errorStates.schedules && <li>{errorStates.schedules}</li>}
                    {errorStates.recurringBreaks && (
                      <li>{errorStates.recurringBreaks}</li>
                    )}
                    {errorStates.onetimeBlocks && (
                      <li>{errorStates.onetimeBlocks}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg mb-6">
          <div className="border-b border-white/15">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-white/90 text-white/95"
                      : "border-transparent text-white/60 hover:text-white/80 hover:border-white/30"
                  }`}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/90"></div>
                <span className="ml-3 text-white/70">
                  Loading availability data...
                </span>
              </div>
            )}

            {!isLoading && staff && (
              <>
                {activeTab === "overview" && <StaffOverviewTab staff={staff} />}
                {activeTab === "schedules" && <SchedulesTab staff={staff} />}
                {activeTab === "breaks" && <RecurringBreaksTab staff={staff} />}
                {activeTab === "blocks" && <OnetimeBlocksTab staff={staff} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
