// ServiceSelector.tsx
// Component for selecting services or packages in the booking process.

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAppointmentForm,
  updateFormData,
} from "apps/business-app/src/store/slices/appointmentFormSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Scissors, Gift, X } from "lucide-react";
import { selectServices } from "apps/business-app/src/store/slices/serviceSlice";
import { AppDispatch } from "apps/business-app/src/store/store";
import { toggleService } from "apps/business-app/src/store/thunks/appointmentFormThunk";
import { Service } from "apps/business-app/src/types/service";

// Utility for formatting currency values (LKR)
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "LKR",
});

type Props = {
  onNext: () => void; // Callback function to proceed to the next step
};

const ServiceSelector: React.FC<Props> = ({ onNext }) => {
  const dispatch = useDispatch<AppDispatch>();

  // Retrieve the list of services from Redux
  const services = useSelector(selectServices);

  // State to manage the list of selected services
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Retrieve the appointment form state from Redux
  const { bookingSlots: selectedItems } = useSelector(selectAppointmentForm);

  // State to manage the active tab (either "services" or "packages")
  const [activeTab, setActiveTab] = useState<"services" | "packages">(
    "services"
  );

  // State to manage the search term for filtering items
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Categorize services into "services" and "packages" based on the `isPackaged` boolean.
   * Filters the services list into two categories for display.
   */
  const categorizedServices = {
    services: services.filter((service) => !service.isPackaged),
    packages: services.filter((service) => service.isPackaged),
  };

  /**
   * Filter items based on the active tab and search term.
   * If the active tab is "services", filter services; otherwise, filter packages.
   */
  const filteredItems =
    activeTab === "services"
      ? categorizedServices.services.filter((s) =>
          s.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : categorizedServices.packages.filter((p) =>
          p.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
        );

  /**
   * Limit the displayed items to the top 5 for better usability.
   * Ensures that only a maximum of 5 items are visible at a time.
   */
  const displayedItems = filteredItems.slice(0, 5);

  /**
   * Calculate the total price of all selected items.
   * Computes the sum of the prices of all selected services.
   */
  const totalPrice = selectedServices.reduce(
    (sum, item) => sum + item.price,
    0
  );

  /**
   * Effect to update the form data in Redux with the total price.
   * Dispatches the `updateFormData` action whenever the total price changes.
   */
  useEffect(() => {
    dispatch(updateFormData({ totalPrice }));
  }, [totalPrice]);

  /**
   * Handle the selection or deselection of a service.
   * Dispatch the `toggleService` thunk to update the `bookingSlots` state in Redux.
   * @param service - The service to toggle (add or remove).
   */
  const handleSelectItem = async (service: Service) => {
    await dispatch(toggleService(service));
  };

  /**
   * Effect to synchronize the selected services with the booking slots.
   * Matches the services list with the `bookingSlots` from Redux to determine which services are selected.
   */
  useEffect(() => {
    const matchedServices = services.filter((service) =>
      selectedItems.some((slot) => slot.serviceId === service.serviceId)
    );
    setSelectedServices(matchedServices);
  }, [selectedItems, services]);

  return (
    <div className="flex flex-col md:flex-row gap-6 text-gray-200">
      {/* Left Column */}
      <div className="flex-1">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["services", "packages"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "services" | "packages")}
              className={`relative px-4 py-2 rounded font-medium transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {/* Icon for each tab */}
              {tab === "services" ? <Scissors size={16} /> : <Gift size={16} />}
              {tab === "services" ? "Services" : "Packages"}
              {/* Animated underline for the active tab */}
              {activeTab === tab && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded"
                />
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-10 py-2 rounded bg-gray-800 text-sm border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        {/* Items List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid grid-cols-1 gap-2 h-72"
          >
            {displayedItems.length === 0 ? (
              <div className="text-gray-400 text-sm">No matching results.</div>
            ) : (
              displayedItems.map((item) => {
                const isSelected = selectedServices.some(
                  (selected) => selected.serviceId === item.serviceId
                );
                return (
                  <motion.button
                    key={item.serviceId}
                    layout
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectItem(item)}
                    className={`flex justify-between items-center w-full h-12 p-3 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-green-600 text-white border-green-500"
                        : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                    }`}
                  >
                    <span className="truncate">{item.serviceName}</span>
                    <span>{currencyFormat.format(item.price)}</span>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-1/3 p-4 rounded border border-gray-700 bg-gray-900 shadow-lg flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-4">Selected Items</h3>
          <div className="space-y-2 overflow-y-auto pr-1 hide-scrollbar custom-scrollbar h-48">
            <AnimatePresence>
              {selectedServices.map((item) => (
                <motion.div
                  key={item.serviceId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex justify-between items-center p-2 bg-gray-800 rounded"
                >
                  <span className="truncate text-sm">{item.serviceName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {currencyFormat.format(item.price)}
                    </span>
                    <button
                      onClick={() => handleSelectItem(item)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 border-t border-gray-600 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{currencyFormat.format(totalPrice)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium rounded cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ServiceSelector;
