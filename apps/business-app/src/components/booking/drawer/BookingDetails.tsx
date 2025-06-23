// File: src/components/BookingDetails.tsx
import React, { useState, useMemo, useCallback } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useSelector } from "react-redux";
import { selectSelectedSlot } from "apps/business-app/src/store/slices/bookingViewSlice";
import { selectBookings } from "apps/business-app/src/store/slices/bookingSlice";
import { selectStaffState } from "apps/business-app/src/store/slices/staffSlice";
import SkeletonLoader from "./booking-detail/SkeletonLoader";
import BookingCard from "./booking-detail/BookingCard";

const BookingDetails: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const selectedSlot = useSelector(selectSelectedSlot);
  const bookings = useSelector(selectBookings);
  const { staffList } = useSelector(selectStaffState);
  const isLoading = false; // replace with real loading state

  const to12Hour = (timeStr: string) => format(parseISO(timeStr), "hh:mm a");
  const isOverlapping = (s1: string, e1: string, s2: string, e2: string) =>
    new Date(s1) < new Date(e2) && new Date(e1) > new Date(s2);

  const filtered = useMemo(
    () =>
      bookings.filter((b) =>
        isOverlapping(
          b.start,
          b.end,
          selectedSlot?.start || "",
          selectedSlot?.end || ""
        )
      ),
    [bookings, selectedSlot]
  );

  const toggle = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  );

  const getDisplayDate = (iso: string) => {
    const d = parseISO(iso);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d, yyyy");
  };

  if (!selectedSlot) {
    return (
      <div className="p-6 text-gray-400">
        <p role="alert">No booking slot selected.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900 rounded-lg shadow-lg text-gray-200">
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900">
        <h2 className="text-2xl font-semibold tracking-tight">
          Booking Details
        </h2>
        <p className="text-sm text-slate-400">
          {getDisplayDate(selectedSlot.start)} &#8226;{" "}
          {to12Hour(selectedSlot.start)} - {to12Hour(selectedSlot.end)}
        </p>
      </div>

      <div className="p-6 relative">
        <div className="absolute left-4 top-2 bottom-2 w-1 bg-slate-700/50 rounded-full" />
        {isLoading ? (
          <SkeletonLoader />
        ) : filtered.length === 0 ? (
          <div className="text-slate-500 italic pl-8" role="note">
            No bookings for this slot.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const isExpanded = expandedId === booking.id;
              return (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  staffList={staffList}
                  isExpanded={isExpanded}
                  onToggle={() => toggle(booking.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
