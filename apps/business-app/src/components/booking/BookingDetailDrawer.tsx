import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  selectBookingDrawerVisible,
  toggleDrawerVisibility,
} from "../../store/slices/bookingSlice";
import BookingDetails from "./drawer/BookingDetails";
import StartTimeSelector from "./drawer/booking-steps/StartTimeSelector";
import ServiceSelector from "./drawer/booking-steps/ServiceSelector";
import ArtistAssignment from "./drawer/booking-steps/ArtistAssignment";
import CustomerForm from "./drawer/booking-steps/CustomerForm";
import BookingSummary from "./drawer/booking-steps/BookingSummary";
import toast from "react-hot-toast";
import StepIndicator from "./drawer/StepIndicator";
import { selectSelectedSlot } from "../../store/slices/bookingViewSlice";

/**
 * Steps for the booking process.
 * Each step includes a title and a corresponding component.
 */
const steps = [
  { title: "Select Start Time", component: StartTimeSelector },
  { title: "Select Services", component: ServiceSelector },
  { title: "Select Artists", component: ArtistAssignment },
  { title: "Enter Customer Details", component: CustomerForm },
  { title: "Appointment Summary", component: BookingSummary },
];

/**
 * BookingDetailDrawer Component
 * Manages the booking process through a multi-step drawer interface.
 */
const BookingDetailDrawer: React.FC = () => {
  // Retrieve the selected slot from Redux
  const selectedSlot = useSelector(selectSelectedSlot);

  // Determine whether the drawer is visible based on Redux state
  const visible = useSelector(selectBookingDrawerVisible)
    ? selectedSlot !== null
    : false;

  const dispatch = useDispatch();

  // State to track the current step in the booking process
  const [currentStep, setCurrentStep] = useState<number | null>(null); // null until started

  // Reference to the drawer container for scrolling
  const drawerRef = useRef<HTMLDivElement>(null);

  /**
   * Navigate to a specific step in the booking process.
   * Allows revisiting completed steps.
   * @param index - The index of the step to navigate to.
   */
  const goToStep = (index: number) => {
    if (index <= (currentStep ?? 0)) setCurrentStep(index);
  };

  /**
   * Proceed to the next step in the booking process.
   * Ensures the user progresses sequentially through the steps.
   */
  const handleNext = () => {
    if (currentStep !== null && currentStep < steps.length - 1) {
      setCurrentStep((prev) => (prev ?? 0) + 1);
    }
  };

  /**
   * Reset the booking process and close the drawer.
   * Displays a success toast notification upon completion.
   */
  const resetActiveStep = () => {
    dispatch(toggleDrawerVisibility());
    setCurrentStep(null);
    toast.success("Booking created successfully!");
  };

  /**
   * Start the booking process by navigating to the first step.
   * Scrolls the drawer container to the top for better user experience.
   */
  const handleStartBooking = () => {
    setCurrentStep(0);

    // Scroll to top of drawer container
    setTimeout(() => {
      drawerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 50);
  };

  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 right-0 z-50 h-screen overflow-auto w-3/5 max-w-4xl bg-slate-800 shadow-lg transition-transform duration-300 ease-in-out ${
        visible ? "-translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full text-gray-100">
        {/* Booking Details */}
        <BookingDetails />

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Make Appointment Button */}
        {currentStep === null && (
          <div className="p-4">
            <button
              onClick={handleStartBooking}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold w-full transition cursor-pointer"
            >
              Make Appointment
            </button>
          </div>
        )}

        {/* Add Booking Section */}
        <div className="flex-1 p-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = currentStep !== null && index < currentStep;
            const StepComponent = step.component;

            return (
              <div key={index} className="flex flex-row items-start relative">
                {/* Step Indicator */}
                <StepIndicator
                  index={index}
                  active={isActive}
                  completed={isCompleted}
                  showLine={steps.length - 1}
                />

                {/* Step Title + Component */}
                <div className="flex-1 mb-4 rounded-xl bg-slate-700 overflow-hidden">
                  <button
                    onClick={() => goToStep(index)}
                    className={`w-full text-left px-4 py-3 flex justify-between items-center cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : isCompleted
                        ? "bg-slate-600 text-slate-300"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    <span className="font-medium">{step.title}</span>
                    {isCompleted && <span className="text-sm">✓</span>}
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key={`step-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4"
                      >
                        <StepComponent onNext={handleNext} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailDrawer;
