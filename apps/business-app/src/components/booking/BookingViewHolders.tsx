import React, { useState } from "react";
import { FaPlus, FaSync } from "react-icons/fa";
import { Tabs, TabsList, TabsTrigger } from "@lib/components/ui/tabs";
import BookingCalendarView from "./views/BookingCalendarView";

const BookingViewHolders: React.FC = () => {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div>
      {/* View Tabs and Action Buttons */}
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="space-x-4">
            <TabsTrigger
              value="calendar"
              className={activeTab === "calendar" ? "text-blue-600" : ""}
            >
              7-Day Calendar
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className={activeTab === "staff" ? "text-blue-600" : ""}
            >
              By Staff
            </TabsTrigger>
            <TabsTrigger
              value="service"
              className={activeTab === "service" ? "text-blue-600" : ""}
            >
              By Service
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded bg-blue-100 hover:bg-blue-200">
            <FaSync className="text-blue-600" />
          </button>
          <button className="p-2 rounded bg-green-100 hover:bg-green-200">
            <FaPlus className="text-green-600" />
          </button>
        </div>
      </div>

      {/* Dynamic View Components */}
      <div className="mt-4">
        {activeTab === "calendar" && (
          <div className="border rounded-md p-4 text-center text-gray-500">
            <BookingCalendarView />
          </div>
        )}
        {activeTab === "staff" && (
          <div className="border rounded-md p-4 text-center text-gray-500">
            Booking View By Staff
          </div>
        )}
        {activeTab === "service" && (
          <div className="border rounded-md p-4 text-center text-gray-500">
            Booking View By Services
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingViewHolders;
