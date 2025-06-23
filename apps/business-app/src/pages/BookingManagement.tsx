import React, { useEffect } from "react";
import BookingSummaryBar from "../components/booking/BookingSummaryBar";
import BookingViewHolders from "../components/booking/BookingViewHolders";
import BookingDetailDrawer from "../components/booking/BookingDetailDrawer";
import { useDispatch, useSelector } from "react-redux";
import {
  selectBookingDrawerVisible,
  selectBookingStateStatus,
  toggleDrawerVisibility,
} from "../store/slices/bookingSlice";
import { AppDispatch } from "../store/store";
import { fetchBookings } from "../store/thunks/bookingThunk";
import LoadingScreen from "../components/loaders/LoadingScreen";

const BookingManagement: React.FC = () => {
  const isDrawerVisible = useSelector(selectBookingDrawerVisible);
  const { isBookingfetched, bookingStateLoading } = useSelector(
    selectBookingStateStatus
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isBookingfetched) {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to 12:00 AM
      const startISO = currentDate.toISOString();

      const endDate = new Date();
      endDate.setDate(currentDate.getDate() + 8); // Add 8 days
      endDate.setHours(0, 0, 0, 0); // Set to 12:00 AM
      const endISO = endDate.toISOString();

      dispatch(
        fetchBookings({
          salonId: "00000000-0000-0000-0000-000000000001",
          start: startISO,
          end: endISO,
        })
      );
    }
  }, [dispatch, isBookingfetched]);

  if (bookingStateLoading) {
    return (
      <>
        <LoadingScreen message={"Loading your experience..."} />
      </>
    );
  }

  return (
    <div className="relative">
      {/* Background content */}
      {isDrawerVisible && (
        <div
          className="fixed w-full h-full backdrop-blur-[1px] z-40"
          onClick={() => {
            dispatch(toggleDrawerVisibility());
          }}
        ></div>
      )}
      <div
        className={`flex flex-col gap-4 p-4 transition ${
          isDrawerVisible ? "blur-[1px]" : ""
        }`}
      >
        <div className="text-2xl font-bold mb-4">Booking Summary</div>
        <BookingSummaryBar />
        <BookingViewHolders />
      </div>

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer />
    </div>
  );
};

export default BookingManagement;
