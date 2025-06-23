import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectServices } from "../../../../../store/slices/serviceSlice";
import {
  assignStaffToService,
  selectAppointmentForm,
} from "../../../../../store/slices/appointmentFormSlice";
import ArtistCard from "./ArtistCard";
import { BookingSlot } from "apps/business-app/src/types/booking";
import { parseISO } from "date-fns";
import { selectStaffState } from "apps/business-app/src/store/slices/staffSlice";
import { AvailableStaff, Staff } from "apps/business-app/src/types/staff";

/**
 * Component for individual sortable items in the list.
 * Represents a single booking slot and allows drag-and-drop reordering.
 */
export const SortableItem: React.FC<{
  item: BookingSlot; // The booking slot represented by this item
}> = ({ item }) => {
  // Hook to make the item sortable
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.serviceId });

  // Apply transform and transition styles for drag-and-drop
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Fetch services and appointment form data from Redux state
  const services = useSelector(selectServices);
  const { availableStaff, bookingSlots, startTime } = useSelector(
    selectAppointmentForm
  );
  const { staffList } = useSelector(selectStaffState);

  const dispatch = useDispatch();

  // State to manage filtered staff and assigned staff details
  const [filteredStaff, setFilteredStaff] = useState<AvailableStaff[]>([]);
  const [staffDetail, setStaffDetail] = useState<Staff | null>(null);

  // Find the service corresponding to the current booking slot
  const service = services.find((s) => s.serviceId === item.serviceId);
  if (!service) {
    return <div className="text-red-500">Service not found</div>;
  }

  /**
   * Filters the available staff for the current booking slot.
   * Checks if staff can perform the service and are available during the slot's time.
   */
  const getAvailableStaffForSlot = (): AvailableStaff[] => {
    const slotStart = parseISO(item.startTime);
    const slotEnd = parseISO(item.endTime);

    const availableStaffs: AvailableStaff[] = [];

    for (const staff of availableStaff) {
      // Step 1: Check if staff can perform the service
      if (!staff.serviceIds.includes(item.serviceId)) continue;

      // Step 2: Check if any availability block fully covers the slot
      const isAvailable = staff.availability.some((availableSlot) => {
        const availableStart = parseISO(availableSlot.start);
        const availableEnd = parseISO(availableSlot.end);

        return slotStart >= availableStart && slotEnd <= availableEnd;
      });

      if (isAvailable) {
        availableStaffs.push(staff);
      }
    }

    return availableStaffs;
  };

  /**
   * Updates the filtered staff list whenever the available staff or booking slot changes.
   */
  useEffect(() => {
    setFilteredStaff(getAvailableStaffForSlot());
  }, [availableStaff, staffList, item, startTime]);

  /**
   * Handles assigning a staff member to the current booking slot.
   * Dispatches the `assignStaffToService` action to update the Redux state.
   * @param staffId - The ID of the staff to assign.
   */
  const onAssign = (staffId: string) => {
    dispatch(
      assignStaffToService({
        serviceId: item.serviceId,
        staffId,
      })
    );
  };

  /**
   * Updates the staff details for the current booking slot.
   * Finds the staff member assigned to the slot based on the `staff_id`.
   */
  useEffect(() => {
    const matchingSlot = bookingSlots.find(
      (slot) => slot.serviceId === item.serviceId
    );

    if (matchingSlot) {
      setStaffDetail(
        staffList.find((staff) => staff.id === matchingSlot.staffId) || null
      );
    } else {
      setStaffDetail(null); // Reset staff detail if no matching slot is found
    }
  }, [bookingSlots, staffList, item.serviceId]);

  return (
    <div style={style} className="p-4 bg-gray-800 rounded shadow space-y-2">
      {/* Draggable header */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="flex justify-between items-center cursor-move"
      >
        <div>
          <div className="font-medium text-white">{service.serviceName}</div>
          <div className="text-sm text-gray-400 capitalize">
            {service.serviceName} - {service.duration} mins
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Assigned to:{" "}
          <span className="text-blue-400">
            {staffDetail
              ? `${staffDetail.firstName} ${staffDetail.lastName}`
              : "None"}
          </span>
        </div>
      </div>

      {/* List of artists available for assignment */}
      {filteredStaff.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filteredStaff.map((staff) => (
            <div
              key={staff.staffId}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(staff.staffId);
              }}
              className={`text-sm p-1 rounded cursor-pointer ${
                staffDetail?.id === staff.staffId
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <ArtistCard artist={staff} />
            </div>
          ))}
        </div>
      ) : (
        // Message when no staff is available
        <div className="p-4 bg-red-900/20 text-red-300 rounded text-center">
          <p className="font-medium">No staff available at this time.</p>
          <p className="text-sm">Please adjust the time or try again later.</p>
        </div>
      )}
    </div>
  );
};
