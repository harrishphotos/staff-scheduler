import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Staff } from "../../../../types/staff";
import { Calendar, Clock, Coffee, CalendarX } from "lucide-react";
import {
  selectSchedules,
  selectRecurringBreaks,
  selectOnetimeBlocks,
  selectWeeklySchedule,
  selectRecurringBreaksByDay,
} from "../../../../store/slices/availabilitySlice";
import { DAYS_OF_WEEK } from "../../../../types/availability";
import { availabilityHelpers } from "../../../../utils/availabilityApi";
import DateStrip from "../../../date/DateStrip";
import SelectedDatePanel from "../../../date/SelectedDatePanel";

interface StaffOverviewTabProps {
  staff: Staff;
}

const StaffOverviewTab: React.FC<StaffOverviewTabProps> = ({ staff }) => {
  const schedules = useSelector(selectSchedules);
  const recurringBreaks = useSelector(selectRecurringBreaks);
  const onetimeBlocks = useSelector(selectOnetimeBlocks);
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const breaksByDay = useSelector(selectRecurringBreaksByDay);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [baseDate, setBaseDate] = useState(new Date());

  const handleSelectDate = (date: Date) => {
    if (selectedDate?.toDateString() === date.toDateString()) {
      setSelectedDate(null); // close panel if clicked again
    } else {
      setSelectedDate(date); // open panel with new date
    }
  };

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

  // // Generate 7 days starting from current day
  // const getCurrentWeekDays = () => {
  //   const currentDate = new Date();
  //   const weekDays = [];

  //   for (let i = 0; i < 7; i++) {
  //     const date = new Date(currentDate);
  //     date.setDate(currentDate.getDate() + i);

  //     const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
  //     const dayInfo = DAYS_OF_WEEK[dayOfWeek];
  //     const dayNumber = date.getDate();

  //     weekDays.push({
  //       date,
  //       dayOfWeek,
  //       dayInfo,
  //       dayNumber,
  //       displayName: `${dayInfo.short}/${dayNumber}`,
  //     });
  //   }

  //   return weekDays;
  // };

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

  // Get overlapping time-off chunks with schedule
  const getOverlappingTimeOff = (
    schedule: any,
    timeOffBlocks: any[],
    targetDate: Date
  ): Array<{ reason: string; start_time: string; end_time: string }> => {
    if (!schedule || timeOffBlocks.length === 0) return [];

    try {
      // Convert schedule times to Date objects for the target date
      const scheduleStart = new Date(targetDate);
      const scheduleEnd = new Date(targetDate);

      const startTime = parseTimeString(schedule.start_time);
      const endTime = parseTimeString(schedule.end_time);

      scheduleStart.setHours(startTime.hours, startTime.minutes, 0, 0);
      scheduleEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

      const overlappingChunks: Array<{
        reason: string;
        start_time: string;
        end_time: string;
      }> = [];

      timeOffBlocks.forEach((block) => {
        const blockStart = new Date(block.start_date_time);
        const blockEnd = new Date(block.end_date_time);

        // Find overlap between schedule and block
        const overlapStart = new Date(
          Math.max(scheduleStart.getTime(), blockStart.getTime())
        );
        const overlapEnd = new Date(
          Math.min(scheduleEnd.getTime(), blockEnd.getTime())
        );

        // If there's an overlap
        if (overlapStart < overlapEnd) {
          overlappingChunks.push({
            reason: block.reason,
            start_time: overlapStart.toTimeString().slice(0, 8), // HH:MM:SS
            end_time: overlapEnd.toTimeString().slice(0, 8), // HH:MM:SS
          });
        }
      });

      return overlappingChunks;
    } catch (error) {
      console.error("Error in getOverlappingTimeOff:", error);
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                Work Schedules
              </p>
              <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {stats.totalSchedules}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-300">
                Active Days
              </p>
              <p className="text-2xl font-semibold text-green-900 dark:text-green-100">
                {stats.activeDays}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-900/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Coffee className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-300">
                Recurring Breaks
              </p>
              <p className="text-2xl font-semibold text-orange-900 dark:text-orange-100">
                {stats.totalBreaks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarX className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-300">
                Time Off Blocks
              </p>
              <p className="text-2xl font-semibold text-red-900 dark:text-red-100">
                {stats.totalBlocks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Weekly Schedule Overview
        </h3>
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() =>
              setBaseDate((prev) => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() - 7);
                return newDate;
              })
            }
            className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            ← Previous Week
          </button>

          <button
            onClick={() =>
              setBaseDate((prev) => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() + 7);
                return newDate;
              })
            }
            className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Next Week →
          </button>
        </div>

        <div className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 mb-4">
          <DateStrip
            days={currentWeekDays}
            selectedDate={selectedDate}
            onSelect={handleSelectDate}
          />
        </div>

        {selectedDate && (
          <SelectedDatePanel
            selectedDate={selectedDate}
            onAddSchedule={(start, end) => {
              console.log("Open modal for:", start, end);
            }}
          />
        )}

        {/*old date block-begin*/}

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
          {currentWeekDays.map((weekDay) => {
            const effectiveSchedule = getEffectiveScheduleForDay(
              weekDay.dayOfWeek,
              weekDay.date
            );
            const dayBreaks = breaksByDay[weekDay.dayOfWeek] || [];
            const timeOffBlocks = getTimeOffForDate(weekDay.date);
            const isToday =
              weekDay.date.toDateString() === new Date().toDateString();

            // Check if schedule is fully covered by time-off
            const isFullyCovered = isScheduleFullyCovered(
              effectiveSchedule,
              timeOffBlocks,
              weekDay.date
            );

            // Get overlapping time-off chunks if not fully covered
            const overlappingTimeOff = !isFullyCovered
              ? getOverlappingTimeOff(
                  effectiveSchedule,
                  timeOffBlocks,
                  weekDay.date
                )
              : [];

            return (
              <div
                key={`${weekDay.dayOfWeek}-${weekDay.dayNumber}`}
                className={`rounded-lg p-3 ${
                  isFullyCovered
                    ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 opacity-60"
                    : isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500"
                    : "bg-gray-50 dark:bg-gray-700"
                }`}
              >
                <h4
                  className={`font-medium mb-2 ${
                    isFullyCovered
                      ? "text-red-900 dark:text-red-100"
                      : isToday
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {weekDay.displayName}
                  {isToday && (
                    <span className="text-xs ml-1 text-blue-600 dark:text-blue-300">
                      (Today)
                    </span>
                  )}
                  {isFullyCovered && (
                    <span className="text-xs ml-1 text-red-600 dark:text-red-300">
                      (Time Off)
                    </span>
                  )}
                </h4>

                {effectiveSchedule ? (
                  <div className="space-y-2">
                    {/* Schedule Time */}
                    <div
                      className={`text-xs px-2 py-1 rounded ${
                        isFullyCovered
                          ? "bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 line-through"
                          : "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                      }`}
                    >
                      {availabilityHelpers.formatTime(
                        effectiveSchedule.start_time
                      )}{" "}
                      -{" "}
                      {availabilityHelpers.formatTime(
                        effectiveSchedule.end_time
                      )}
                    </div>

                    {/* Recurring Breaks */}
                    {dayBreaks.map((breakItem, index) => (
                      <div
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${
                          isFullyCovered
                            ? "bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 opacity-60"
                            : "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200"
                        }`}
                      >
                        Break:{" "}
                        {availabilityHelpers.formatTime(breakItem.start_time)} -{" "}
                        {availabilityHelpers.formatTime(breakItem.end_time)}
                      </div>
                    ))}

                    {/* Overlapping Time Off (partial)  */}
                    {overlappingTimeOff.map((timeOff, index) => (
                      <div
                        key={index}
                        className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-2 py-1 rounded border border-red-300 dark:border-red-700"
                      >
                        Time Off:{" "}
                        {availabilityHelpers.formatTime(timeOff.start_time)} -{" "}
                        {availabilityHelpers.formatTime(timeOff.end_time)}
                        <div className="text-xs opacity-75 mt-1">
                          {timeOff.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    No schedule
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/*old date block-end*/}

      {/* Upcoming Time Off */}
      {upcomingBlocks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Upcoming Time Off (Next 30 Days)
          </h3>
          <div className="space-y-3">
            {upcomingBlocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    {block.reason}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {new Date(block.start_date_time).toLocaleDateString()} -{" "}
                    {new Date(block.end_date_time).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded">
                  Time Off
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalSchedules === 0 &&
        stats.totalBreaks === 0 &&
        stats.totalBlocks === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No availability settings configured
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start by setting up work schedules, breaks, and time-off periods
              for {staff.firstName}.
            </p>
          </div>
        )}
    </div>
  );
};

export default StaffOverviewTab;
