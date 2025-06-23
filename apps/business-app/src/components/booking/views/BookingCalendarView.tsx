import React from "react";
import { FaRegClock } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@lib/components/ui/tooltip";
import { useDispatch, useSelector } from "react-redux";
import {
  selectBookings,
  toggleDrawerVisibility,
} from "../../../store/slices/bookingSlice";
import { setSelectedSlot } from "apps/business-app/src/store/slices/bookingViewSlice";
import { selectStaffState } from "apps/business-app/src/store/slices/staffSlice";
import { getStaffColorMap } from "apps/business-app/src/helpers/staffColorMapper";
import { format, parseISO } from "date-fns";

const BookingCalendarView: React.FC = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectBookings);
  const { staffList } = useSelector(selectStaffState);

  console.log("Bookings:", bookings);

  // Generate staff color mapping
  const staffColorMap = getStaffColorMap(staffList);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // Calendar hours from 8AM to 8PM
  const hourHeight = 60; // Each hour block is 60px tall

  // Generate 7 consecutive day objects (Today + next 6 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : date.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
      }),
      fullDate: new Date(date.setHours(0, 0, 0, 0)), // Normalize time to midnight
    };
  });

  // When user clicks a time slot, dispatch selected time slot and open drawer
  const handleSlotClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0); // Set the start time
    const end = new Date(start);
    end.setHours(start.getHours() + 1); // Set the end time (1-hour slot)

    // Convert to ISO format with SL time zone
    const startISO = new Date(
      start.toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    ).toISOString();
    const endISO = new Date(
      end.toLocaleString("en-US", { timeZone: "Asia/Colombo" })
    ).toISOString();

    dispatch(
      setSelectedSlot({
        start: startISO,
        end: endISO,
        date: day.toISOString(), // Keep the date in default ISO format
      })
    );
    dispatch(toggleDrawerVisibility());
  };

  // Convert HH:mm string into vertical offset in pixels based on start hour (8AM)
  const getMinutesOffset = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const startHour = 8;
    return (hour - startHour) * hourHeight + (minute / 60) * hourHeight;
  };

  return (
    <div className="w-full overflow-auto font-sans">
      {/* Header Row with Clock Icon + Day Labels */}
      <div
        className="grid sticky top-0 z-10 bg-white shadow-sm"
        style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
      >
        {/* Clock icon cell */}
        <div className="flex items-center justify-center border-b py-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-neutral-800">
          <FaRegClock />
        </div>

        {/* Day labels */}
        {days.map(({ label, dateLabel }, i) => (
          <div
            key={i}
            className="text-center border-b py-2 text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 flex flex-col items-center justify-center text-sm"
          >
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dateLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left time column + 7 day columns */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `80px repeat(7, 1fr)`,
          height: hours.length * hourHeight,
        }}
      >
        {/* Time Labels Column */}
        <div className="flex flex-col">
          {hours.map((h) => {
            const period = h >= 12 ? "PM" : "AM";
            const hourLabel = h === 0 ? 12 : h > 12 ? h - 12 : h;
            return (
              <div
                key={h}
                className="h-[60px] pr-2 text-xs text-right pt-1 text-gray-500 border-r border-dotted border-gray-300"
              >
                {hourLabel} {period}
              </div>
            );
          })}
        </div>

        {/* Day Columns */}
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="relative border-r border-gray-200">
            {/* Clickable time slots for booking */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-dotted border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleSlotClick(day.fullDate, hour)}
              />
            ))}

            {/* Employee-wise stacked booking blocks */}
            {staffList.map((staff, empIdx) => (
              <div
                key={staff.id}
                className="absolute top-0 h-full"
                style={{
                  width: "15px",
                  left: `${empIdx * 16}px`, // Offset each employee horizontally
                }}
              >
                {/* Loop through bookings and render only for this employee on this day */}
                {bookings
                  .flatMap((booking) =>
                    (booking.services ?? []).map((service) => ({
                      bookingId: booking.id,
                      customerName: booking.customer,
                      staff: service.staff,
                      id: `${booking.id}-${service.serviceId}-${service.start}`,
                      name: service.serviceId,
                      start: service.start,
                      end: service.end,
                    }))
                  )
                  .filter((s) => {
                    const start = new Date(s.start);
                    return (
                      start.toDateString() === day.fullDate.toDateString() &&
                      s.staff === staff.id
                    );
                  })
                  .map((s) => {
                    const startTime = s.start.split("T")[1];
                    const endTime = s.end.split("T")[1];
                    const top = getMinutesOffset(startTime);
                    const bottom = getMinutesOffset(endTime);
                    const height = bottom - top;

                    return (
                      <TooltipProvider key={s.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Booking block */}
                            <div
                              className="absolute rounded shadow-sm transition-all duration-150 hover:brightness-90"
                              style={{
                                top,
                                height,
                                width: "15px",
                                backgroundColor: staffColorMap[staff.id], // Use staff color from mapping
                              }}
                            />
                          </TooltipTrigger>

                          {/* Tooltip with booking details */}
                          <TooltipContent
                            side="right"
                            align="center"
                            className="text-xs p-3 bg-neutral-900 border border-neutral-700 shadow-lg rounded-lg max-w-[240px] text-white"
                          >
                            <div className="font-semibold text-sm mb-1">
                              {staff.firstName} {staff.lastName || ""}
                            </div>
                            <div className="text-gray-300 mb-1">
                              <span className="font-medium text-gray-400">
                                Customer:
                              </span>{" "}
                              {s.customerName}
                            </div>
                            <div className="text-gray-300 mb-1">
                              <span className="font-medium text-gray-400">
                                Time:
                              </span>{" "}
                              {format(parseISO(s.start), "hh:mm a")} –{" "}
                              {format(parseISO(s.end), "hh:mm a")}
                            </div>
                            <div className="text-gray-300 mb-1">
                              <span className="font-medium text-gray-400">
                                Service:
                              </span>{" "}
                              {s.name}
                            </div>
                            <div className="text-gray-400 mt-2 text-[11px]">
                              <span className="font-medium text-gray-500">
                                Code:
                              </span>{" "}
                              {s.id.slice(-10)}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendarView;
