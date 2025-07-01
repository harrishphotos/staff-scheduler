import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/store";
import {
  selectStaffState,
  selectStaffStateStatus,
} from "../../../store/slices/staffSlice";
import { fetchStaff } from "../../../store/thunks/staffThunk";
import { Staff } from "../../../types/staff";
import StaffDetail from "../StaffDetail";
import toast from "react-hot-toast";

const StaffAvailability: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { staffList } = useSelector(selectStaffState);
  const { loading, error } = useSelector(selectStaffStateStatus);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Fetch staff data if not already loaded
  useEffect(() => {
    if (staffList.length === 0 && !loading) {
      dispatch(fetchStaff());
    }
  }, [dispatch, staffList.length, loading]);

  // Find the selected staff member when staffId or staffList changes
  useEffect(() => {
    if (staffId && staffList.length > 0) {
      const staff = staffList.find((s) => s.id === staffId);
      if (staff) {
        setSelectedStaff(staff);
      } else {
        // Staff not found, show error and navigate back
        toast.error("Staff member not found");
        navigate("/staff");
      }
    }
  }, [staffId, staffList, navigate]);

  // Handle error state
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleBack = () => {
    navigate("/staff");
  };

  // Error state - only show error if there's an error and no staff data at all
  if (error && staffList.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-none mx-auto">
          <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white/95 mb-2">
                Unable to Load Staff Data
              </h2>
              <p className="text-white/60 mb-6">
                {error || "There was an error loading the staff information."}
              </p>
              <button
                onClick={handleBack}
                className="bg-white/95 hover:bg-white/85 text-black font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg"
              >
                Back to Staff Management
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedStaff ? (
        <StaffDetail staff={selectedStaff} onBack={handleBack} />
      ) : (
        <div className="p-6">
          <div className="max-w-none mx-auto">
            <div className="animate-pulse">
              {/* Header skeleton */}
              <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-4 bg-white/5 rounded w-32"></div>
                  <div className="h-4 bg-white/5 rounded w-4"></div>
                  <div className="h-4 bg-white/5 rounded w-40"></div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-white/5 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-white/5 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-white/5 rounded w-40"></div>
                  </div>
                </div>
              </div>
              {/* Tab skeleton */}
              <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg">
                <div className="border-b border-white/15 px-6 py-4">
                  <div className="flex space-x-4">
                    <div className="h-8 bg-white/5 rounded w-20"></div>
                    <div className="h-8 bg-white/5 rounded w-24"></div>
                    <div className="h-8 bg-white/5 rounded w-16"></div>
                    <div className="h-8 bg-white/5 rounded w-20"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffAvailability;
