import React from "react";
import { useSelector } from "react-redux";
import {
  selectWeeklySchedule,
  selectRecurringBreaksByDay,
  selectOnetimeBlocks,
} from "../../store/slices/availabilitySlice";
import { availabilityHelpers } from "../../utils/availabilityApi";

interface SelectedDatePanelProps {
  selectedDate: Date;
  onAddSchedule?: (start: string, end: string) => void;
}

type Block =
  | { id: string; type: "break"; start: string; end: string }
  | { id: string; type: "timeoff"; start: string; end: string; reason: string };

const SelectedDatePanel: React.FC<SelectedDatePanelProps> = ({
  selectedDate,
  onAddSchedule,
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

  // ✅ FIXED block filtering by comparing DATE only
  const blocks = onetimeBlocks.filter((block) => {
    const blockStartDate = new Date(block.start_date_time)
      .toISOString()
      .split("T")[0];
    const blockEndDate = new Date(block.end_date_time)
      .toISOString()
      .split("T")[0];
    return dateStr >= blockStartDate && dateStr <= blockEndDate;
  });

  const timelineStartHour = 8;
  const timelineEndHour = 20;
  const totalMinutes = (timelineEndHour - timelineStartHour) * 60;

  const formatTimeToHHMM = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const getPositionStyle = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    const startOffsetMins = sh * 60 + sm - timelineStartHour * 60;
    const endOffsetMins = eh * 60 + em - timelineStartHour * 60;

    const leftPct = (startOffsetMins / totalMinutes) * 100;
    const widthPct = ((endOffsetMins - startOffsetMins) / totalMinutes) * 100;

    return {
      left: `${leftPct}%`,
      width: widthPct < 1 ? "1.5%" : `${widthPct}%`,
      minWidth: "10px",
    };
  };

  const allBlocks: Block[] = [
    ...breaks.map(
      (b) =>
        ({
          type: "break",
          id: b.id,
          start: b.start_time,
          end: b.end_time,
        } as Block)
    ),
    ...blocks.map(
      (b) =>
        ({
          type: "timeoff",
          id: b.id,
          start: formatTimeToHHMM(new Date(b.start_date_time)),
          end: formatTimeToHHMM(new Date(b.end_date_time)),
          reason: b.reason,
        } as Block)
    ),
  ];

  const sortedBlocks = allBlocks.slice().sort((a, b) => {
    const [aH, aM] = a.start.split(":").map(Number);
    const [bH, bM] = b.start.split(":").map(Number);
    return aH !== bH ? aH - bH : aM - bM;
  });

  const freeSlots: { start: string; end: string }[] = [];
  let lastEnd = `${timelineStartHour.toString().padStart(2, "0")}:00`;

  sortedBlocks.forEach((block) => {
    if (block.start > lastEnd) {
      freeSlots.push({ start: lastEnd, end: block.start });
    }
    if (block.end > lastEnd) lastEnd = block.end;
  });

  if (lastEnd < `${timelineEndHour}:00`) {
    freeSlots.push({ start: lastEnd, end: `${timelineEndHour}:00` });
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mt-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Schedule for {selectedDate.toDateString()}
      </h3>

      {/* Schedule Time Info Section */}
      {schedules.length > 0 && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">Planned Work Schedule:</p>
          {schedules.map((s) => (
            <div key={s.id} className="mb-1">
              {availabilityHelpers.formatTime(s.start_time)} -{" "}
              {availabilityHelpers.formatTime(s.end_time)}
            </div>
          ))}
        </div>
      )}

      {/* Timeline Strip */}
      <div className="relative w-full h-16 border rounded bg-gray-50 dark:bg-gray-700 overflow-hidden">
        {[...Array(timelineEndHour - timelineStartHour)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
            style={{
              left: `${(i / (timelineEndHour - timelineStartHour)) * 100}%`,
            }}
          />
        ))}

        {sortedBlocks.map((block) => (
          <div
            key={`${block.type}-${block.id}`}
            className={`absolute top-1 bottom-1 px-2 text-xs flex items-center rounded text-white shadow-sm
              ${block.type === "break" ? "bg-orange-500" : "bg-red-500"}`}
            style={getPositionStyle(block.start, block.end)}
          >
            {availabilityHelpers.formatTime(block.start)} -{" "}
            {availabilityHelpers.formatTime(block.end)}
            {block.type === "timeoff" && (
              <span className="ml-1 text-[10px] italic text-white opacity-90">
                ({block.reason})
              </span>
            )}
          </div>
        ))}

        {freeSlots.map((slot, idx) => (
          <div
            key={idx}
            className="absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 text-xs flex items-center justify-center cursor-pointer"
            style={{ ...getPositionStyle(slot.start, slot.end) }}
            onClick={() => onAddSchedule?.(slot.start, slot.end)}
          >
            ➕ Add
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedDatePanel;
