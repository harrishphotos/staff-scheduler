import React from "react";
import { useSelector } from "react-redux";
import {
  selectWeeklySchedule,
  selectRecurringBreaksByDay,
  selectOnetimeBlocks,
} from "../../store/slices/availabilitySlice";
import { availabilityHelpers } from "../../utils/availabilityApi";
import {
  isScheduleFullyCovered,
  getOverlappingTimeOff,
} from "../../utils/scheduleHelpers";

interface SelectedDatePanelProps {
  selectedDate: Date;
}

const SelectedDatePanel: React.FC<SelectedDatePanelProps> = ({
  selectedDate,
}) => {
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const recurringBreaksByDay = useSelector(selectRecurringBreaksByDay);
  const onetimeBlocks = useSelector(selectOnetimeBlocks);

  const dayOfWeek = selectedDate.getDay();
  const dateStr = selectedDate.toISOString().split("T")[0];

  const schedules = (weeklySchedule[dayOfWeek] || []).filter((schedule) => {
    return (
      dateStr >= schedule.valid_from &&
      (!schedule.valid_until || dateStr <= schedule.valid_until)
    );
  });

  const breaks = recurringBreaksByDay[dayOfWeek] || [];

  const blocks = onetimeBlocks.filter((block) => {
    const start = new Date(block.start_date_time);
    const end = new Date(block.end_date_time);
    return selectedDate >= start && selectedDate <= end;
  });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Schedule for {selectedDate.toDateString()}
      </h3>

      {/* Work Schedule */}
      <div className="mb-3">
        <h4 className="text-md font-medium text-blue-600 dark:text-blue-300 mb-2">
          Work Schedule
        </h4>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-500">No schedule for this day</p>
        ) : (
          schedules.map((schedule) => {
            const isFullyCovered = isScheduleFullyCovered(
              schedule,
              blocks,
              selectedDate
            );
            const overlaps = getOverlappingTimeOff(
              schedule,
              blocks,
              selectedDate
            );

            return (
              <div key={schedule.id} className="mb-2">
                <div
                  className={`text-sm px-3 py-2 rounded ${
                    isFullyCovered
                      ? "bg-red-200 text-red-900 line-through"
                      : "bg-blue-100 text-blue-900"
                  }`}
                >
                  {availabilityHelpers.formatTime(schedule.start_time)} -{" "}
                  {availabilityHelpers.formatTime(schedule.end_time)}
                </div>

                {isFullyCovered && (
                  <span className="ml-2 text-xs text-red-700">
                    (Fully Covered by Time-Off)
                  </span>
                )}

                {!isFullyCovered &&
                  overlaps.map((off, i) => (
                    <div
                      key={i}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 mt-1 rounded border border-red-300"
                    >
                      Time Off: {off.start_time} - {off.end_time}
                      <div className="text-xs opacity-70">{off.reason}</div>
                    </div>
                  ))}
              </div>
            );
          })
        )}
      </div>

      {/* Breaks */}
      <div className="mb-3">
        <h4 className="text-md font-medium text-orange-600 dark:text-orange-300 mb-2">
          Recurring Breaks
        </h4>
        {breaks.length === 0 ? (
          <p className="text-sm text-gray-500">No breaks</p>
        ) : (
          breaks.map((b) => (
            <div key={b.id} className="text-sm mb-1 text-orange-900">
              {availabilityHelpers.formatTime(b.start_time)} -{" "}
              {availabilityHelpers.formatTime(b.end_time)}
            </div>
          ))
        )}
      </div>

      {/* Time-Off Blocks */}
      <div>
        <h4 className="text-md font-medium text-red-600 dark:text-red-300 mb-2">
          Time Off Blocks
        </h4>
        {blocks.length === 0 ? (
          <p className="text-sm text-gray-500">No time-off</p>
        ) : (
          blocks.map((b) => (
            <div key={b.id} className="text-sm mb-1 text-red-900">
              {new Date(b.start_date_time).toLocaleTimeString()} -{" "}
              {new Date(b.end_date_time).toLocaleTimeString()}
              <div className="text-xs text-red-500">{b.reason}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SelectedDatePanel;
