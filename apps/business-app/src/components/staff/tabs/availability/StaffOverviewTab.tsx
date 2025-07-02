import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../../../store/store";
import { Staff } from "../../../../types/staff";
import { Calendar, Clock, Coffee, CalendarX } from "lucide-react";
import {
  selectSchedules,
  selectRecurringBreaks,
  selectOnetimeBlocks,
  selectWeeklySchedule,
  selectRecurringBreaksByDay,
  selectEmployeeAvailability,
  selectLoadingStates,
  selectErrorStates,
} from "../../../../store/slices/availabilitySlice";
import { fetchEmployeeAvailabilityByDate } from "../../../../store/thunks/availabilityThunk";
import { DAYS_OF_WEEK } from "../../../../types/availability";
import { availabilityHelpers } from "../../../../utils/availabilityApi";
import DailyAvailabilityTimeline from "./DailyAvailabilityTimeline";
// import DateStrip from "../../../date/DateStrip";
// import SelectedDatePanel from "../../../date/SelectedDatePanel";

interface StaffOverviewTabProps {
  staff: Staff;
}

const StaffOverviewTab: React.FC<StaffOverviewTabProps> = ({ staff }) => {
  const dispatch = useDispatch<AppDispatch>();
  const schedules = useSelector(selectSchedules);
  const recurringBreaks = useSelector(selectRecurringBreaks);
  const onetimeBlocks = useSelector(selectOnetimeBlocks);
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const breaksByDay = useSelector(selectRecurringBreaksByDay);
  const employeeAvailability = useSelector(selectEmployeeAvailability);
  const loadingStates = useSelector(selectLoadingStates);
  const errorStates = useSelector(selectErrorStates);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [baseDate, setBaseDate] = useState(new Date());
  const [timelineDate, setTimelineDate] = useState(new Date());

  const handleSelectDate = (date: Date) => {
    if (selectedDate?.toDateString() === date.toDateString()) {
      setSelectedDate(null); // close panel if clicked again
    } else {
      setSelectedDate(date); // open panel with new date
    }
  };

  // Fetch availability data for timeline when staff or date changes
  useEffect(() => {
    if (staff?.id && timelineDate) {
      const dateString = timelineDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      dispatch(
        fetchEmployeeAvailabilityByDate({
          employee_id: staff.id,
          date: dateString,
        })
      );
    }
  }, [dispatch, staff?.id, timelineDate]);

  // Helper function to parse time safely
  const parseTimeString = (timeString: string) => {
    // Handle different time formats from backend
    if (timeString.includes("T")) {
      // ISO format: "0000-01-01T09:00:00Z"
      const timePart = timeString.split("T")[1];
      const [hours, minutes] = timePart.split(":").map(Number);
      return { hours, minutes };
    } else {
      // Simple format: "09:00:00" or "09:00"
      const [hours, minutes] = timeString.split(":").map(Number);
      return { hours, minutes };
    }
  };

  // Calculate stats
  const stats = {
    totalSchedules: schedules.length,
    totalBreaks: recurringBreaks.length,
    totalBlocks: onetimeBlocks.length,
    activeDays: Object.keys(weeklySchedule).length,
  };

  // Upcoming blocks (next 30 days)
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingBlocks = onetimeBlocks.filter((block) => {
    const blockStart = new Date(block.start_date_time);
    return blockStart >= now && blockStart <= next30Days;
  });

  const getWeekDaysFrom = (startDate: Date) => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayOfWeek = date.getDay();
      const dayInfo = DAYS_OF_WEEK[dayOfWeek];
      const dayNumber = date.getDate();

      weekDays.push({
        date,
        dayOfWeek,
        dayInfo,
        dayNumber,
        displayName: `${dayInfo.short}/${dayNumber}`,
      });
    }
    return weekDays;
  };

  const currentWeekDays = getWeekDaysFrom(baseDate);

  // Get effective schedule for a specific day
  const getEffectiveScheduleForDay = (dayOfWeek: number, targetDate: Date) => {
    const daySchedules = weeklySchedule[dayOfWeek] || [];
    const currentDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Filter schedules that are valid for the target date
    const validSchedules = daySchedules.filter((schedule) => {
      const validFrom = schedule.valid_from;
      const validUntil = schedule.valid_until;

      // Check if current date falls within the valid range
      const isAfterValidFrom = currentDateStr >= validFrom;
      const isBeforeValidUntil = !validUntil || currentDateStr <= validUntil;

      return isAfterValidFrom && isBeforeValidUntil;
    });

    // If multiple valid schedules, return the one with the most recent valid_from
    if (validSchedules.length > 1) {
      return validSchedules.reduce((latest, current) => {
        return current.valid_from > latest.valid_from ? current : latest;
      });
    }

    return validSchedules[0] || null;
  };

  // Get time-off blocks for a specific date
  const getTimeOffForDate = (targetDate: Date) => {
    const targetDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const filteredBlocks = onetimeBlocks.filter((block) => {
      const blockStartDate = new Date(block.start_date_time)
        .toISOString()
        .split("T")[0];
      const blockEndDate = new Date(block.end_date_time)
        .toISOString()
        .split("T")[0];

      // Check if target date falls within the block's date range
      const isInRange =
        targetDateStr >= blockStartDate && targetDateStr <= blockEndDate;

      return isInRange;
    });

    return filteredBlocks;
  };

  // Check if schedule is completely covered by time-off
  const isScheduleFullyCovered = (
    schedule: any,
    timeOffBlocks: any[],
    targetDate: Date
  ) => {
    if (!schedule || timeOffBlocks.length === 0) return false;

    try {
      // Convert schedule times to Date objects for the target date
      const scheduleStart = new Date(targetDate);
      const scheduleEnd = new Date(targetDate);

      const startTime = parseTimeString(schedule.start_time);
      const endTime = parseTimeString(schedule.end_time);

      scheduleStart.setHours(startTime.hours, startTime.minutes, 0, 0);
      scheduleEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

      // Check if any time-off block completely covers the schedule
      return timeOffBlocks.some((block) => {
        const blockStart = new Date(block.start_date_time);
        const blockEnd = new Date(block.end_date_time);

        return blockStart <= scheduleStart && blockEnd >= scheduleEnd;
      });
    } catch (error) {
      console.error("Error in isScheduleFullyCovered:", error);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white/95 mb-1">
          Availability Overview
        </h3>
        <p className="text-sm text-white/60">
          Overview of {staff.firstName}'s schedules, breaks, and time-off
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-400">Schedules</p>
              <p className="text-2xl font-semibold text-white/95">
                {stats.totalSchedules}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center justify-center">
                <Coffee className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-400">Breaks</p>
              <p className="text-2xl font-semibold text-white/95">
                {stats.totalBreaks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500/20 border border-red-400/30 rounded-lg flex items-center justify-center">
                <CalendarX className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-400">Time Off</p>
              <p className="text-2xl font-semibold text-white/95">
                {stats.totalBlocks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-400">Active Days</p>
              <p className="text-2xl font-semibold text-white/95">
                {stats.activeDays}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Availability Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-white/95">Daily Timeline</h4>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-white/70">Date:</label>
            <input
              type="date"
              value={timelineDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setTimelineDate(new Date(e.target.value + "T00:00:00"))
              }
              className="bg-white/10 border border-white/20 rounded px-3 py-1 text-sm text-white/90 
                         focus:bg-white/15 focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>

        {employeeAvailability && (
          <DailyAvailabilityTimeline
            availabilityData={employeeAvailability}
            staffName={`${staff.firstName} ${staff.lastName}`}
          />
        )}

        {!employeeAvailability && loadingStates.employeeAvailability && (
          <div className="animate-pulse">
            <div className="h-4 bg-white/5 rounded w-1/3 mb-2"></div>
            <div className="h-12 bg-white/5 rounded mb-3"></div>
            <div className="flex justify-between">
              <div className="h-3 bg-white/5 rounded w-16"></div>
              <div className="h-3 bg-white/5 rounded w-16"></div>
            </div>
          </div>
        )}

        {!employeeAvailability &&
          !loadingStates.employeeAvailability &&
          errorStates.employeeAvailability && (
            <div className="text-center py-4">
              <span className="text-red-400">
                {errorStates.employeeAvailability}
              </span>
            </div>
          )}

        {!employeeAvailability &&
          !loadingStates.employeeAvailability &&
          !errorStates.employeeAvailability && (
            <div className="text-center py-4">
              <span className="text-white/60">
                Select a date to view availability
              </span>
            </div>
          )}
      </div>

      {/* Weekly Schedule Summary */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-medium text-white/95 mb-4">
          Weekly Schedule Summary
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = weeklySchedule[day.value] || [];
            const dayBreaks = breaksByDay[day.value] || [];

            return (
              <div
                key={day.value}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-200"
              >
                <h5 className="font-medium text-white/95 mb-2 text-center text-sm">
                  {day.short}
                </h5>

                {/* Schedules */}
                {daySchedules.length > 0 ? (
                  <div className="space-y-1 mb-2">
                    {daySchedules.slice(0, 2).map((schedule, index) => (
                      <div
                        key={index}
                        className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded border border-blue-400/30"
                      >
                        {availabilityHelpers.formatTime(schedule.start_time)} -{" "}
                        {availabilityHelpers.formatTime(schedule.end_time)}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-xs text-white/60 text-center">
                        +{daySchedules.length - 2} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-white/50 text-center py-2 border border-dashed border-white/20 rounded mb-2">
                    No schedule
                  </div>
                )}

                {/* Breaks */}
                {dayBreaks.length > 0 && (
                  <div className="space-y-1">
                    {dayBreaks.slice(0, 1).map((breakItem, index) => (
                      <div
                        key={index}
                        className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded border border-orange-400/30"
                      >
                        {breakItem.reason}
                      </div>
                    ))}
                    {dayBreaks.length > 1 && (
                      <div className="text-xs text-white/60 text-center">
                        +{dayBreaks.length - 1} breaks
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Time Off */}
      {upcomingBlocks.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-medium text-white/95 mb-4">
            Upcoming Time Off ({upcomingBlocks.length})
          </h4>
          <div className="space-y-3">
            {upcomingBlocks.slice(0, 5).map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-400/30 rounded-lg hover:bg-red-500/15 transition-all duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-red-400">
                      {block.reason}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded border border-red-400/30">
                      {Math.ceil(
                        (new Date(block.end_date_time).getTime() -
                          new Date(block.start_date_time).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-white/60">
                      {new Date(block.start_date_time).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-white/50">→</span>
                    <span className="text-sm text-white/60">
                      {new Date(block.end_date_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {upcomingBlocks.length > 5 && (
              <div className="text-center">
                <span className="text-sm text-white/60">
                  +{upcomingBlocks.length - 5} more upcoming blocks
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalSchedules === 0 &&
        stats.totalBreaks === 0 &&
        stats.totalBlocks === 0 && (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
            <div className="mx-auto w-24 h-24 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-12 h-12 text-white/50" />
            </div>
            <h3 className="text-lg font-medium text-white/95 mb-2">
              No Availability Data
            </h3>
            <p className="text-white/60 mb-6">
              {staff.firstName} doesn't have any schedules, breaks, or time-off
              blocks set up yet.
            </p>
            <div className="flex justify-center space-x-3">
              <button className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90 font-medium py-2.5 px-4 rounded-lg border border-white/10 transition-all duration-200">
                Add Schedule
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90 font-medium py-2.5 px-4 rounded-lg border border-white/10 transition-all duration-200">
                Add Break
              </button>
            </div>
          </div>
        )}

      {/* Hidden Components - Will be implemented later */}
      {/* 
      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        baseDate={baseDate}
        onBaseChange={setBaseDate}
      />
      
      {selectedDate && (
        <SelectedDatePanel
          selectedDate={selectedDate}
          staff={staff}
          onClose={() => setSelectedDate(null)}
        />
      )}
      */}
    </div>
  );
};

export default StaffOverviewTab;
