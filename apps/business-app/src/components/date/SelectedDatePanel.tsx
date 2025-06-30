import React from "react";
import { useSelector } from "react-redux";
import {
  selectWeeklySchedule,
  selectRecurringBreaksByDay,
  selectOnetimeBlocks,
} from "../../store/slices/availabilitySlice";
import { availabilityHelpers } from "../../utils/availabilityApi";
import {
  Schedule,
  RecurringBreak,
  OnetimeBlock,
} from "../../types/availability";

interface SelectedDatePanelProps {
  selectedDate: Date;
  onAddSchedule?: (start: string, end: string) => void;
}

const SelectedDatePanel: React.FC<SelectedDatePanelProps> = ({
  selectedDate,
  onAddSchedule,
}) => {
  const dayOfWeek = selectedDate.getDay();
  const weeklySchedule = useSelector(selectWeeklySchedule);
  const breaksByDay = useSelector(selectRecurringBreaksByDay);
  const onetimeBlocks = useSelector(selectOnetimeBlocks);

  const schedule = weeklySchedule[dayOfWeek]?.[0] || null;
  const dayBreaks = breaksByDay[dayOfWeek] || [];

  const timeOffs = onetimeBlocks.filter((block) => {
    const blockDate = new Date(block.start_date_time);
    return (
      blockDate.toDateString() === selectedDate.toDateString() &&
      block.type === "timeoff"
    );
  });

  const appointments = onetimeBlocks.filter((block) => {
    const blockDate = new Date(block.start_date_time);
    return (
      blockDate.toDateString() === selectedDate.toDateString() &&
      block.type === "appointment"
    );
  });

  const allBlocks = [
    ...dayBreaks.map((b) => {
      try {
        const parsedStart = new Date(b.start_time);
        const parsedEnd = new Date(b.end_time);

        const start = new Date(selectedDate);
        const end = new Date(selectedDate);

        start.setHours(parsedStart.getHours(), parsedStart.getMinutes(), 0, 0);
        end.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);

        return {
          id: b.id,
          type: "break" as const,
          start: start.toISOString(),
          end: end.toISOString(),
        };
      } catch (err) {
        console.error("❌ Error parsing break:", b, err);
        return null;
      }
    }),

    ...timeOffs.map((b) => ({
      id: b.id,
      type: "timeoff" as const,
      start: b.start_date_time,
      end: b.end_date_time,
      reason: b.reason,
    })),
    ...appointments.map((b) => ({
      id: b.id,
      type: "appointment" as const,
      start: b.start_date_time,
      end: b.end_date_time,
      reason: b.reason,
    })),
  ].filter((b): b is Exclude<typeof b, null> => b !== null);

  const sortedBlocks = allBlocks.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  // 🕘 Dynamic schedule bounds
  let scheduleStartMinutes = 0;
  let scheduleEndMinutes = 1440;
  let totalScheduleMinutes = 1440;

  if (schedule) {
    try {
      const scheduleStart = new Date(selectedDate);
      const scheduleEnd = new Date(selectedDate);

      const parsedStart = new Date(schedule.start_time);
      const parsedEnd = new Date(schedule.end_time);

      scheduleStart.setHours(
        parsedStart.getHours(),
        parsedStart.getMinutes(),
        0,
        0
      );
      scheduleEnd.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);

      const startMin =
        scheduleStart.getHours() * 60 + scheduleStart.getMinutes();
      const endMin = scheduleEnd.getHours() * 60 + scheduleEnd.getMinutes();

      if (isNaN(startMin) || isNaN(endMin)) {
        console.warn("❌ Invalid schedule time", schedule);
      } else {
        scheduleStartMinutes = startMin;
        scheduleEndMinutes = endMin;
        totalScheduleMinutes = Math.max(endMin - startMin, 1);
        console.log("✅ Schedule Minutes", {
          scheduleStartMinutes,
          scheduleEndMinutes,
          totalScheduleMinutes,
        });
      }
    } catch (err) {
      console.error("❌ Schedule parse error", err);
    }
  }

  // 🧠 Grid helper (15-min steps)
  const snapToGrid = (minutes: number) => {
    return Math.round(minutes / 15) * 15;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md space-y-3">
      <h2 className="text-lg font-semibold">{selectedDate.toDateString()}</h2>

      {schedule ? (
        <div className="text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 p-2 rounded">
          Schedule: {availabilityHelpers.formatTime(schedule.start_time)} -{" "}
          {availabilityHelpers.formatTime(schedule.end_time)}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No schedule
        </div>
      )}

      {/* 🟪 Strip with 15-min snapping */}
      <div className="relative h-14 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-600"></div>

        {sortedBlocks.map((block) => {
          const blockStart = new Date(block.start);
          const blockEnd = new Date(block.end);

          const startMin = blockStart.getHours() * 60 + blockStart.getMinutes();
          const endMin = blockEnd.getHours() * 60 + blockEnd.getMinutes();
          console.log(`[${block.type}]`, {
            start: block.start,
            parsed: new Date(block.start),
            startMin,
          });
          if (
            startMin >= scheduleEndMinutes ||
            endMin <= scheduleStartMinutes
          ) {
            return null; // block is outside schedule range
          }

          const snappedStart = snapToGrid(
            Math.max(startMin, scheduleStartMinutes)
          );
          const snappedEnd = snapToGrid(Math.min(endMin, scheduleEndMinutes));

          const relativeStart = snappedStart - scheduleStartMinutes;
          const relativeDuration = snappedEnd - snappedStart;

          const leftPercent = (relativeStart / totalScheduleMinutes) * 100;
          const widthPercent = (relativeDuration / totalScheduleMinutes) * 100;

          if (relativeDuration <= 0) return null;

          // TEMP DEBUG
          console.log(
            `[${
              block.type
            }] starts at: ${snappedStart}, relative: ${relativeStart}, %: ${leftPercent.toFixed(
              2
            )}`
          );

          let bgColor = "";
          if (block.type === "break") bgColor = "bg-orange-400";
          if (block.type === "timeoff") bgColor = "bg-red-500";
          if (block.type === "appointment") bgColor = "bg-green-500";

          return (
            <div
              key={block.id}
              className={`${bgColor} absolute top-1 h-10 rounded text-xs text-white px-1 flex items-center`}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
            >
              {block.type}
            </div>
          );
        })}
      </div>

      {/* 🟩 Detail list */}
      <div className="space-y-1 text-sm">
        {sortedBlocks.map((block) => (
          <div key={block.id} className="text-xs">
            {block.type.charAt(0).toUpperCase() + block.type.slice(1)}:{" "}
            {availabilityHelpers.formatTime(block.start)} -{" "}
            {availabilityHelpers.formatTime(block.end)}{" "}
            {"reason" in block && block.reason && (
              <span className="text-gray-500">({block.reason})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedDatePanel;
