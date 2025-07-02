import React from "react";
import { EmployeeAvailabilityResponse } from "../../../../types/availability";

interface TimelineSegment {
  startMinutes: number;
  endMinutes: number;
  type: "WORKING" | "BREAK" | "TIME_OFF";
  reason?: string;
  widthPercentage: number;
  startTime: Date;
  endTime: Date;
}

interface DailyAvailabilityTimelineProps {
  availabilityData: EmployeeAvailabilityResponse;
  staffName: string;
}

const AVAILABILITY_COLORS = {
  WORKING: {
    bg: "bg-green-500/20",
    border: "border-green-400/30",
    text: "text-green-400",
    label: "Available",
  },
  BREAK: {
    bg: "bg-orange-500/20",
    border: "border-orange-400/30",
    text: "text-orange-400",
    label: "Break",
  },
  TIME_OFF: {
    bg: "bg-red-500/20",
    border: "border-red-400/30",
    text: "text-red-400",
    label: "Unavailable",
  },
};

const DailyAvailabilityTimeline: React.FC<DailyAvailabilityTimelineProps> = ({
  availabilityData,
  staffName,
}) => {
  // Helper function to convert UTC onetimeblock time to Sri Lankan time (add 5:30)
  const convertOnetimeBlockTime = (utcTimeString: string): string => {
    const utcDate = new Date(utcTimeString);
    // Add 5 hours and 30 minutes for Sri Lankan time
    const sriLankanDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
    return sriLankanDate.toISOString();
  };

  // Helper function to extract time from date string (for schedules and breaks - use as-is)
  const extractTime = (timeString: string): string => {
    // Extract just the time part from ISO string like "2025-07-02T09:00:00Z"
    if (timeString.includes("T")) {
      const timePart = timeString.split("T")[1];
      const time = timePart.split(".")[0]; // Remove milliseconds if present
      return time.replace("Z", ""); // Remove Z if present
    }
    return timeString;
  };

  // Helper function to convert time string to minutes since start of schedule
  const getMinutesFromStart = (
    timeString: string,
    scheduleStart: Date
  ): number => {
    const time = new Date(timeString);
    return Math.floor((time.getTime() - scheduleStart.getTime()) / (1000 * 60));
  };

  // Helper function to format time (extract HH:MM from ISO string)
  const formatTime = (timeString: string): string => {
    const time = extractTime(timeString);
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to calculate duration
  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    return `${remainingMinutes}m`;
  };

  if (!availabilityData.schedule) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <h4 className="font-medium text-white/95 mb-2">Daily Timeline</h4>
        <div className="text-center py-8">
          <span className="text-white/60">
            No schedule available for this date
          </span>
        </div>
      </div>
    );
  }

  const schedule = availabilityData.schedule;
  const scheduleStart = new Date(schedule.start_time);
  const scheduleEnd = new Date(schedule.end_time);
  const totalMinutes = Math.floor(
    (scheduleEnd.getTime() - scheduleStart.getTime()) / (1000 * 60)
  );

  // Create timeline events
  const events: Array<{
    time: number;
    type: "START" | "END";
    category: "BREAK" | "TIME_OFF";
    reason?: string;
  }> = [];

  // Add break events
  availabilityData.breaks.forEach((breakItem) => {
    const startMinutes = getMinutesFromStart(
      breakItem.start_time,
      scheduleStart
    );
    const endMinutes = getMinutesFromStart(breakItem.end_time, scheduleStart);

    if (startMinutes >= 0 && endMinutes <= totalMinutes) {
      events.push({
        time: startMinutes,
        type: "START",
        category: "BREAK",
        reason: breakItem.reason,
      });
      events.push({
        time: endMinutes,
        type: "END",
        category: "BREAK",
        reason: breakItem.reason,
      });
    }
  });

  // Add time-off events (convert UTC to Sri Lankan time first)
  availabilityData.onetimeblocks.forEach((block) => {
    // Convert UTC times to Sri Lankan time for onetimeblocks only
    const convertedStartTime = convertOnetimeBlockTime(block.start_time);
    const convertedEndTime = convertOnetimeBlockTime(block.end_time);

    const startMinutes = getMinutesFromStart(convertedStartTime, scheduleStart);
    const endMinutes = getMinutesFromStart(convertedEndTime, scheduleStart);

    if (startMinutes >= 0 && endMinutes <= totalMinutes) {
      events.push({
        time: startMinutes,
        type: "START",
        category: "TIME_OFF",
        reason: block.reason,
      });
      events.push({
        time: endMinutes,
        type: "END",
        category: "TIME_OFF",
        reason: block.reason,
      });
    }
  });

  // Sort events by time
  events.sort((a, b) => a.time - b.time);

  // Create timeline segments
  const segments: TimelineSegment[] = [];
  let currentTime = 0;
  let activeBreak = false;
  let activeTimeOff = false;
  let currentReason = "";

  // Add timestamp points for rendering
  const timeStamps = new Set<number>([0, totalMinutes]);

  events.forEach((event) => {
    if (currentTime < event.time) {
      // Add segment from currentTime to event.time
      const type = activeTimeOff
        ? "TIME_OFF"
        : activeBreak
        ? "BREAK"
        : "WORKING";
      const widthPercentage = ((event.time - currentTime) / totalMinutes) * 100;

      const segmentStartTime = new Date(
        scheduleStart.getTime() + currentTime * 60 * 1000
      );
      const segmentEndTime = new Date(
        scheduleStart.getTime() + event.time * 60 * 1000
      );

      segments.push({
        startMinutes: currentTime,
        endMinutes: event.time,
        type,
        reason: type !== "WORKING" ? currentReason : undefined,
        widthPercentage,
        startTime: segmentStartTime,
        endTime: segmentEndTime,
      });
    }

    timeStamps.add(event.time);

    // Update state
    if (event.category === "BREAK") {
      if (event.type === "START") {
        activeBreak = true;
        currentReason = event.reason || "Break";
      } else {
        activeBreak = false;
      }
    } else if (event.category === "TIME_OFF") {
      if (event.type === "START") {
        activeTimeOff = true;
        currentReason = event.reason || "Time Off";
      } else {
        activeTimeOff = false;
      }
    }

    currentTime = event.time;
  });

  // Add final segment if needed
  if (currentTime < totalMinutes) {
    const type = activeTimeOff ? "TIME_OFF" : activeBreak ? "BREAK" : "WORKING";
    const widthPercentage = ((totalMinutes - currentTime) / totalMinutes) * 100;

    const segmentStartTime = new Date(
      scheduleStart.getTime() + currentTime * 60 * 1000
    );
    const segmentEndTime = scheduleEnd;

    segments.push({
      startMinutes: currentTime,
      endMinutes: totalMinutes,
      type,
      reason: type !== "WORKING" ? currentReason : undefined,
      widthPercentage,
      startTime: segmentStartTime,
      endTime: segmentEndTime,
    });
  }

  // Calculate totals for summary
  const workingMinutes = segments
    .filter((s) => s.type === "WORKING")
    .reduce((sum, s) => sum + (s.endMinutes - s.startMinutes), 0);
  const breakMinutes = segments
    .filter((s) => s.type === "BREAK")
    .reduce((sum, s) => sum + (s.endMinutes - s.startMinutes), 0);
  const timeOffMinutes = segments
    .filter((s) => s.type === "TIME_OFF")
    .reduce((sum, s) => sum + (s.endMinutes - s.startMinutes), 0);

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Convert timestamps to array and sort
  const timeStampArray = Array.from(timeStamps).sort((a, b) => a - b);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4">
        <h4 className="font-medium text-white/95 mb-2">Daily Timeline</h4>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-white/70">
            {staffName} -{" "}
            {new Date(availabilityData.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <div className="flex gap-4">
            <span className="text-green-400">
              Available: {formatMinutes(workingMinutes)}
            </span>
            {breakMinutes > 0 && (
              <span className="text-orange-400">
                Breaks: {formatMinutes(breakMinutes)}
              </span>
            )}
            {timeOffMinutes > 0 && (
              <span className="text-red-400">
                Time Off: {formatMinutes(timeOffMinutes)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Strip */}
      <div className="mb-3">
        <div className="flex w-full h-12 rounded-lg overflow-hidden border border-white/10">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`${AVAILABILITY_COLORS[segment.type].bg} ${
                AVAILABILITY_COLORS[segment.type].border
              } 
                          border-r last:border-r-0 flex items-center justify-center relative group cursor-pointer
                          hover:opacity-80 transition-opacity duration-200`}
              style={{ width: `${segment.widthPercentage}%` }}
            >
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 
                              bg-black/90 text-white text-xs rounded px-2 py-1 pointer-events-none z-10 whitespace-nowrap"
              >
                <div className="font-medium">
                  {segment.reason || AVAILABILITY_COLORS[segment.type].label}
                </div>
                <div>
                  {formatTime(segment.startTime.toISOString())} -{" "}
                  {formatTime(segment.endTime.toISOString())}
                </div>
                <div>
                  Duration:{" "}
                  {calculateDuration(
                    segment.startTime.toISOString(),
                    segment.endTime.toISOString()
                  )}
                </div>
              </div>

              {/* Label inside segment (only if wide enough) */}
              {segment.widthPercentage > 15 && (
                <span
                  className={`text-xs ${
                    AVAILABILITY_COLORS[segment.type].text
                  } font-medium`}
                >
                  {segment.reason || AVAILABILITY_COLORS[segment.type].label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Time Labels */}
      <div className="relative">
        <div className="flex justify-between text-xs text-white/60">
          {timeStampArray.map((minutes, index) => {
            const timeAtMinutes = new Date(
              scheduleStart.getTime() + minutes * 60 * 1000
            );
            const position = (minutes / totalMinutes) * 100;

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {formatTime(timeAtMinutes.toISOString())}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyAvailabilityTimeline;
