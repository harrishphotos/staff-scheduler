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
  ChevronLeft,
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
            <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-white/5 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-white/5 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-none mx-auto">
        {/* Header Section */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg p-6 mb-6">
          {/* Enhanced Breadcrumb Navigation */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="group flex items-center space-x-2 text-white/70 hover:text-white/90 transition-all duration-200 mb-4"
            >
              <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="text-sm font-medium">
                Back to Staff Management
              </span>
            </button>

            {/* Staff Info Header */}
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {staff.profilePic ? (
                  <img
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/10 shadow-lg"
                    src={staff.profilePic}
                    alt={`${staff.firstName} ${staff.lastName}`}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/95 font-bold text-2xl border-4 border-white/10 shadow-lg">
                    {staff.firstName[0]}
                    {staff.lastName[0]}
                  </div>
                )}
              </div>

              {/* Staff Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white/95">
                    {staff.firstName} {staff.lastName}
                  </h1>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-lg ${
                      staff.isActive
                        ? "bg-green-500/20 text-green-400 border border-green-400/30"
                        : "bg-red-500/20 text-red-400 border border-red-400/30"
                    }`}
                  >
                    {staff.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-white/60 font-medium">{staff.role}</p>
                  <p className="text-sm text-white/50">{staff.email}</p>
                  {staff.services && staff.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {staff.services.slice(0, 3).map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-xs bg-white/5 text-white/70 rounded-lg border border-white/10"
                        >
                          {service}
                        </span>
                      ))}
                      {staff.services.length > 3 && (
                        <span className="px-3 py-1 text-xs bg-white/5 text-white/50 rounded-lg border border-white/10">
                          +{staff.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Management Tabs */}
        <div className="relative z-10 bg-black/80 border border-white/15 backdrop-blur-xl shadow-2xl rounded-lg">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="border-b border-white/15 px-6">
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-1 h-auto rounded-xl">
                <TabsTrigger
                  value="overview"
                  className={`relative px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    activeTab === "overview"
                      ? "bg-white/95 text-black border-white/95"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Overview</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="schedules"
                  className={`relative px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    activeTab === "schedules"
                      ? "bg-white/95 text-black border-white/95"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Schedules</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="breaks"
                  className={`relative px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    activeTab === "breaks"
                      ? "bg-white/95 text-black border-white/95"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Coffee className="w-5 h-5" />
                    <span>Breaks</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="blocks"
                  className={`relative px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    activeTab === "blocks"
                      ? "bg-white/95 text-black border-white/95"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white/90"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CalendarX className="w-5 h-5" />
                    <span>Time Off</span>
                  </div>
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
    </div>
  );
};

export default StaffDetail;
