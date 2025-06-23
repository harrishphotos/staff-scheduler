import React from "react";
import StaffAvatar from "@lib/ui/StaffAvatar";
import { useDispatch, useSelector } from "react-redux";
import { selectAppointmentForm } from "apps/business-app/src/store/slices/appointmentFormSlice";
import { selectServices } from "apps/business-app/src/store/slices/serviceSlice";
import { selectStaffState } from "apps/business-app/src/store/slices/staffSlice";
import { AppDispatch } from "apps/business-app/src/store/store";
import { createAppointment } from "apps/business-app/src/store/thunks/appointmentFormThunk";

// Define the props for the BookingSummary component
type Props = {
  onNext: () => void; // Callback function triggered when the "Confirm Appointment" button is clicked
};

// BookingSummary component displays a summary of the selected services, customer details, and appointment details
const BookingSummary: React.FC<Props> = ({ onNext }) => {
  // Access the form data from the Redux store
  const { formData } = useSelector(selectAppointmentForm);

  // Access the list of services from the Redux store
  const services = useSelector(selectServices);

  // Access the list of staff members from the Redux store
  const { staffList } = useSelector(selectStaffState);

  // Helper function to get a service by its ID
  const getServiceById = (id: string) =>
    services.find((s) => s.serviceId === id);

  // Helper function to get a staff member by their ID
  const getStaffById = (id: string) => staffList.find((s) => s.id === id);

  // Format the appointment date for display
  const formattedDate = () => {
    const slot = formData.bookingSlots[0];
    if (!slot) return "N/A";
    const date = new Date(slot.startTime);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format the time range for the appointment
  const timeRange = () => {
    if (formData.bookingSlots.length === 0) return "N/A";
    const times = formData.bookingSlots.map((slot) => ({
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
    }));
    const start = new Date(Math.min(...times.map((t) => t.start.getTime())));
    const end = new Date(Math.max(...times.map((t) => t.end.getTime())));
    return `${start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Group booking slots into packaged and individual services
  const grouped = {
    packaged: formData.bookingSlots.filter((slot) => slot.isPackaged),
    services: formData.bookingSlots.filter((slot) => !slot.isPackaged),
  };

  // Calculate the total duration of the appointment
  const getTotalDuration = () => {
    return formData.bookingSlots.reduce((total, slot) => {
      const service = getServiceById(slot.serviceId);
      return service ? total + service.duration : total;
    }, 0);
  };

  const dispatch = useDispatch<AppDispatch>();

  const handleConfirmAppointment = () => {
    dispatch(createAppointment());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column – Services & Packages */}
        <div className="bg-[#1E1E2F] p-6 rounded-2xl border border-gray-700 shadow-lg space-y-5">
          <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
            Selected Services
          </h3>

          {/* Display individual services */}
          {grouped.services.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-400 font-medium text-sm">
                Individual Services:
              </p>
              <div className="flex flex-col gap-3">
                {grouped.services.map((slot, idx) => {
                  const service = getServiceById(slot.serviceId);
                  const staffObj = getStaffById(slot.staffId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-800 p-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          src={staffObj?.profilePic || ""}
                          alt={staffObj?.firstName || "Staff"}
                        />
                        <div className="text-sm text-gray-100">
                          <p>{service?.serviceName || "Unknown"}</p>
                          <p className="text-xs text-gray-400">
                            {service?.duration} mins by{" "}
                            {staffObj?.firstName || "Staff"}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-300 text-sm">
                        LKR {service?.price?.toFixed(2) || "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Display packaged services */}
          {grouped.packaged.length > 0 && (
            <div className="space-y-3">
              <p className="text-gray-400 font-medium text-sm">
                Package Services:
              </p>
              <div className="flex flex-col gap-3">
                {grouped.packaged.map((slot, idx) => {
                  const service = getServiceById(slot.serviceId);
                  const staffObj = getStaffById(slot.staffId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-800 p-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          src={staffObj?.profilePic || ""}
                          alt={staffObj?.firstName || "Staff"}
                        />
                        <div className="text-sm text-gray-100">
                          <p>{service?.serviceName || "Unknown"}</p>
                          <p className="text-xs text-gray-400">
                            {service?.duration} mins by{" "}
                            {staffObj?.firstName || "Staff"}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-300 text-sm">
                        LKR {service?.price?.toFixed(2) || "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column – Customer & Appointment Details */}
        <div className="bg-[#1E1E2F] p-6 rounded-2xl border border-gray-700 shadow-lg space-y-6">
          {/* Appointment Summary Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
              📅 Appointment Summary
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">Date</span>
                <span className="text-gray-100">{formattedDate()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">Time</span>
                <span className="text-gray-100">{timeRange()}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">
                  Total Duration
                </span>
                <span className="text-gray-100">
                  {getTotalDuration()} minutes
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">Total Price</span>
                <span className="text-yellow-400 font-bold">
                  LKR {formData.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
              👤 Customer Info
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">Name</span>
                <span className="text-gray-100">{formData.customerName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium">Phone</span>
                <span className="text-gray-100">{formData.customerNumber}</span>
              </div>

              {formData.notes && (
                <div className="col-span-2">
                  <span className="text-gray-400 font-medium">Notes</span>
                  <p className="text-gray-100">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="pt-6">
        <button
          onClick={() => handleConfirmAppointment()} // Trigger the onNext callback when clicked
          className="w-full py-3 rounded-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 hover:brightness-110 transition text-[#1E1E2F] font-semibold text-lg shadow-md cursor-pointer"
        >
          Confirm Appointment
        </button>
      </div>
    </div>
  );
};

// Export the BookingSummary component for use in other parts of the application
export default BookingSummary;
