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
    <div className="grid grid-cols-7 gap-2 w-full">
      {days.map((day) => {
        const isToday = isSameDay(day.date, new Date());
        const isSelected = selectedDate
          ? isSameDay(day.date, selectedDate)
          : false;

        return (
          <div
            key={day.date.toDateString()}
            onClick={() => onSelect(day.date)}
            className={`rounded-xl p-3 border text-center cursor-pointer transition-all duration-200
              ${
                isToday
                  ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500"
                  : "bg-gray-50 dark:bg-gray-800"
              }
              ${
                isSelected
                  ? "border-blue-500 font-semibold shadow-md"
                  : "border-gray-200 dark:border-gray-600"
              }
              hover:bg-blue-100/30 dark:hover:bg-blue-900/30
            `}
          >
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {day.dayInfo.short}
            </div>
            <div className="text-2xl text-gray-900 dark:text-white">
              {day.dayNumber}
            </div>
            <div
              className="text-[10px] mt-1 font-medium"
              style={{ minHeight: "14px" }}
            >
              {isToday ? (
                <span className="text-blue-600 dark:text-blue-300">Today</span>
              ) : (
                <span className="invisible">Today</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DateStrip;
