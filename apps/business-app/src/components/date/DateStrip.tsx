import React from "react";

interface WeekDayItem {
  date: Date;
  dayOfWeek: number;
  dayInfo: { short: string; label: string };
  dayNumber: number;
  displayName: string;
}

interface DateStripProps {
  days: WeekDayItem[];
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

const DateStrip: React.FC<DateStripProps> = ({
  days,
  selectedDate,
  onSelect,
}) => {
  const isSameDay = (d1: Date, d2: Date) =>
    d1.toDateString() === d2.toDateString();

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {days.map((day) => {
        const isToday = isSameDay(day.date, new Date());
        const isSelected = selectedDate
          ? isSameDay(day.date, selectedDate)
          : false;

        return (
          <div
            key={day.date.toDateString()}
            onClick={() => onSelect(day.date)}
            className={`min-w-[80px] p-2 rounded-lg cursor-pointer text-center border
              ${
                isToday
                  ? "bg-blue-100 border-blue-400"
                  : "bg-white border-gray-300"
              }
              ${isSelected ? "ring-2 ring-blue-500 font-semibold" : ""}
              hover:bg-blue-50`}
          >
            <div className="text-xs text-gray-600">{day.dayInfo.short}</div>
            <div className="text-xl">{day.dayNumber}</div>
            {isToday && (
              <div className="text-[10px] text-blue-600 mt-1 font-medium">
                Today
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DateStrip;
