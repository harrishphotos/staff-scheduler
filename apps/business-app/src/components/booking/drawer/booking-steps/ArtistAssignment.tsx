import React, { useEffect, useState } from "react";
import ReorderableServiceList from "./artist-assignment/ReorderableServiceList";
import ArtistCard from "./artist-assignment/ArtistCard";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAppointmentForm,
  updateFormData,
} from "apps/business-app/src/store/slices/appointmentFormSlice";
import { selectStaffState } from "apps/business-app/src/store/slices/staffSlice";

type Props = {
  onNext: () => void; // Callback function to handle the "Next" button click
};

/**
 * ArtistAssignment Component
 * This component handles the artist assignment step in the booking process.
 * It displays a list of available artists, a reorderable service list, and a "Next" button.
 * The "Next" button is enabled only when all booking slots have valid staff assignments.
 */
const ArtistAssignment: React.FC<Props> = ({ onNext }) => {
  // Select available staff and booking slots from the Redux store
  const { availableStaff } = useSelector(selectAppointmentForm);
  const { staffList } = useSelector(selectStaffState);
  const { bookingSlots } = useSelector(selectAppointmentForm);

  // State to manage whether the user can proceed to the next step
  const [canProceed, setCanProceed] = useState(false);

  // Initialize the dispatch function
  const dispatch = useDispatch();

  /**
   * useEffect to validate booking slots.
   * Checks if all booking slots have a valid `staff_id` that matches an ID in the `staffList`.
   * Updates the `canProceed` state based on the validation result.
   */
  useEffect(() => {
    const allSlotsHaveValidStaff = bookingSlots.every((slot) =>
      staffList.some((staff) => staff.id === slot.staffId)
    );

    setCanProceed(allSlotsHaveValidStaff);
  }, [bookingSlots, staffList]);

  /**
   * Handle the "Next" button click.
   * Dispatches the `updateFormData` action to update the formData with the bookingSlots.
   */
  const handleNext = () => {
    dispatch(updateFormData({ bookingSlots })); // Update formData with bookingSlots
    onNext(); // Trigger the onNext callback
  };

  return (
    <div className="space-y-6">
      {/* Available Artists Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {availableStaff.map((staff) => (
          <ArtistCard key={staff.staffId} artist={staff} />
        ))}
      </div>

      {/* Reorderable Service List */}
      <ReorderableServiceList />

      {/* Next Button */}
      <button
        onClick={() => handleNext()} // Trigger the onNext callback when clicked
        disabled={!canProceed} // Disable the button if `canProceed` is false
        className={`w-full px-4 py-2 rounded ${
          canProceed
            ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" // Enabled button styles
            : "bg-gray-600 text-gray-400 cursor-not-allowed" // Disabled button styles
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default ArtistAssignment;
