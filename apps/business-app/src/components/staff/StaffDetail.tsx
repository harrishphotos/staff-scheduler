import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import { Staff } from "../../types/staff";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@lib/components/ui/tabs";
import {
  BarChart3,
  Calendar,
  Coffee,
  CalendarX,
  ChevronRight,
} from "lucide-react";
import {
  selectActiveTab,
  setActiveTab,
  setSelectedEmployee,
} from "../../store/slices/availabilitySlice";
import {
  fetchSchedules,
  fetchRecurringBreaks,
  fetchOnetimeBlocks,
} from "../../store/thunks/availabilityThunk";
import StaffOverviewTab from "./tabs/availability/StaffOverviewTab";
import SchedulesTab from "./tabs/availability/SchedulesTab";
import RecurringBreaksTab from "./tabs/availability/RecurringBreaksTab";
import OnetimeBlocksTab from "./tabs/availability/OnetimeBlocksTab";

interface StaffDetailProps {
  staff: Staff;
  onBack?: () => void;
}

const StaffDetail: React.FC<StaffDetailProps> = ({ staff, onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const activeTab = useSelector(selectActiveTab);

  // Initialize data when component mounts or staff changes
  useEffect(() => {
    if (staff?.id) {
      dispatch(setSelectedEmployee(staff.id));
      // Fetch all availability data for this staff member
      dispatch(fetchSchedules(staff.id));
      dispatch(fetchRecurringBreaks(staff.id));
      dispatch(fetchOnetimeBlocks(staff.id));
    }
  }, [dispatch, staff?.id]);

  const handleTabChange = (value: string) => {
    dispatch(
      setActiveTab(value as "overview" | "schedules" | "breaks" | "blocks")
    );
  };

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <button
            onClick={onBack}
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Staff Management
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Availability Management</span>
        </div>

        {/* Staff Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {staff.profilePic ? (
                <img
                  className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  src={staff.profilePic}
                  alt={`${staff.firstName} ${staff.lastName}`}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white dark:border-gray-700 shadow-lg">
                  {staff.firstName[0]}
                  {staff.lastName[0]}
                </div>
              )}
            </div>

            {/* Staff Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {staff.firstName} {staff.lastName}
                </h1>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    staff.isActive
                      ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                      : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                  }`}
                >
                  {staff.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {staff.role}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {staff.email}
                </p>
                {staff.services && staff.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {staff.services.slice(0, 3).map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {service}
                      </span>
                    ))}
                    {staff.services.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        +{staff.services.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col space-y-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Edit Staff Info
              </button>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                View Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Management Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <TabsList className="grid w-full grid-cols-4 bg-transparent p-1 h-auto  dark:bg-gray-800/50 rounded-xl">
              <TabsTrigger
                value="overview"
                className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/10 rounded-lg transition-all duration-300 ease-out hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-400 py-3 group"
              >
                <div className="flex items-center space-x-2 relative z-10">
                  <BarChart3 className="w-5 h-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <span className="font-medium">Overview</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </TabsTrigger>

              <TabsTrigger
                value="schedules"
                className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/10 rounded-lg transition-all duration-300 ease-out hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-400 py-3 group"
              >
                <div className="flex items-center space-x-2 relative z-10">
                  <Calendar className="w-5 h-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <span className="font-medium">Schedules</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </TabsTrigger>

              <TabsTrigger
                value="breaks"
                className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/10 rounded-lg transition-all duration-300 ease-out hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-400 py-3 group"
              >
                <div className="flex items-center space-x-2 relative z-10">
                  <Coffee className="w-5 h-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <span className="font-medium">Breaks</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </TabsTrigger>

              <TabsTrigger
                value="blocks"
                className="relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/10 rounded-lg transition-all duration-300 ease-out hover:bg-white/60 dark:hover:bg-gray-700/60 text-gray-600 dark:text-gray-400 py-3 group"
              >
                <div className="flex items-center space-x-2 relative z-10">
                  <CalendarX className="w-5 h-5 transition-transform duration-300 group-data-[state=active]:scale-110" />
                  <span className="font-medium">Time Off</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0">
              <StaffOverviewTab staff={staff} />
            </TabsContent>

            <TabsContent value="schedules" className="mt-0">
              <SchedulesTab staff={staff} />
            </TabsContent>

            <TabsContent value="breaks" className="mt-0">
              <RecurringBreaksTab staff={staff} />
            </TabsContent>

            <TabsContent value="blocks" className="mt-0">
              <OnetimeBlocksTab staff={staff} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffDetail;
