import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { selectSelectedSlot } from "apps/business-app/src/store/slices/bookingViewSlice";
import { AppDispatch } from "apps/business-app/src/store/store";
import {
  selectAppointmentForm,
  setStartTime,
} from "apps/business-app/src/store/slices/appointmentFormSlice";

type Props = {
  onNext: () => void; // Callback function to proceed to the next step
};

type TimeOption = {
  label: string; // Display label for the time option (e.g., "08:15 AM")
  value: string; // Value for the time option in 24-hour format (e.g., "08:15")
};

const StartTimeSelector: React.FC<Props> = ({ onNext }) => {
  const dispatch = useDispatch<AppDispatch>();

  // Retrieve the current appointment form state, including the ISO-formatted startTime
  const { startTime } = useSelector(selectAppointmentForm);
  console.log("StartTimeSelector rendered with startTime:", startTime);

  // Retrieve the selected slot from the Redux store
  const selectedSlot = useSelector(selectSelectedSlot);

  // Extract the start time of the selected slot
  const slotStart = selectedSlot?.start;

  // Format the date of the selected slot for display (e.g., "Jun 15, 2025")
  const formattedDate = slotStart
    ? new Date(slotStart).toLocaleDateString("en-US", {
        timeZone: "Asia/Colombo",
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "";

  /**
   * Generates an array of time options in 15-minute intervals based on the slot start time.
   * Each option includes:
   * - `label`: Display label in AM/PM format (e.g., "08:15 AM").
   * - `value`: Time in 24-hour format (e.g., "08:15").
   * @param start - The ISO start time of the slot.
   * @returns Array of time options.
   */
  const generateOptions = (start: string): TimeOption[] => {
    const options: TimeOption[] = [];
    const startDate = new Date(start);
    for (let i = 0; i < 4; i++) {
      const optionDate = new Date(startDate.getTime() + i * 15 * 60 * 1000);

      const label = optionDate.toLocaleString("en-US", {
        timeZone: "Asia/Colombo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const value = optionDate
        .toLocaleTimeString("en-GB", {
          timeZone: "Asia/Colombo",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .slice(0, 5); // Extract "HH:mm"

      options.push({ label, value });
    }
    return options;
  };

  // Generate time options based on the slot start time
  const options = slotStart ? generateOptions(slotStart) : [];

  // State to track the manually selected time
  const [manualTime, setManualTime] = useState("");

  /**
   * Effect to initialize the manual time input and highlight the matching option
   * if the `startTime` from the state matches one of the generated options.
   */
  useEffect(() => {
    if (options.length > 0) {
      if (startTime) {
        // Extract the time part from the ISO-formatted startTime
        const isoTime = new Date(startTime).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Find the matching option based on the ISO time
        const matchingOption = options.find(
          (option) => option.value === isoTime
        );
        if (matchingOption) {
          setManualTime(matchingOption.value); // Set manualTime to the matching option
        } else {
          setManualTime(options[0].value); // Default to the first option
        }
      } else {
        setManualTime(options[0].value); // Default to the first option if startTime is null
      }
    }
  }, [slotStart, startTime]);

  /**
   * Handles changes to the manual time input.
   * Updates the `manualTime` state with the new value.
   * @param e - Input change event.
   */
  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualTime(e.target.value);
  };

  /**
   * Handles submission of the manually selected time.
   * Converts the selected time into ISO format and dispatches the `setStartTime` action.
   */
  const handleManualTimeSubmit = () => {
    if (manualTime && slotStart) {
      const selectedDate = new Date(slotStart).toISOString().split("T")[0]; // Extract the date part
      const isoDateTime = new Date(
        `${selectedDate}T${manualTime}:00`
      ).toISOString();

      dispatch(setStartTime(isoDateTime)); // Dispatch the ISO-formatted time
      onNext(); // Proceed to the next step
    }
  };

  /**
   * Handles clicks on a time option.
   * Converts the selected time into ISO format and dispatches the `setStartTime` action.
   * Updates the `manualTime` state to reflect the selected option.
   * @param value - The selected time in 24-hour format (e.g., "08:15").
   */
  const handleOptionClick = (value: string) => {
    if (slotStart) {
      const selectedDate = new Date(slotStart).toISOString().split("T")[0]; // Extract the date part
      const isoDateTime = new Date(`${selectedDate}T${value}:00`).toISOString();
      setManualTime(value); // Update the manual time state
      dispatch(setStartTime(isoDateTime)); // Dispatch the ISO-formatted time
      onNext(); // Proceed to the next step
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="px-8 py-6 rounded-3xl border border-gray-700 shadow-2xl max-w-xl mx-auto backdrop-blur-xl bg-[#1E1E2F]/80 space-y-8"
    >
      {/* Display the formatted date */}
      {formattedDate && (
        <h2 className="text-white text-lg font-medium text-center">
          {formattedDate}
        </h2>
      )}

      <h2 className="text-white text-xl font-semibold text-center">
        Choose Start Time
      </h2>

      {/* Render time options */}
      <div className="grid grid-cols-2 gap-4">
        {options.map(({ label, value }) => (
          <motion.button
            key={value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionClick(value)}
            className={`w-full py-3 rounded-xl text-white transition-all duration-300 shadow-lg cursor-pointer ${
              manualTime === value
                ? "bg-yellow-500 text-black" // Highlight selected option
                : "bg-gradient-to-br from-gray-800 to-gray-700 hover:from-yellow-500 hover:to-yellow-400 hover:text-black"
            }`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="mx-4 text-gray-400 text-sm">or set manually</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      {/* Manual time input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <input
          type="time"
          value={manualTime}
          onChange={handleManualTimeChange}
          className="flex-1 p-3 rounded-xl bg-[#2A2A3B] border border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 outline-none transition-all cursor-pointer"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManualTimeSubmit}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-[#1E1E2F] font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          Set Time
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default StartTimeSelector;
