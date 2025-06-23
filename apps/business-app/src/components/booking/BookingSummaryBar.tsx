import React, { useState } from "react";
import { FaCalendarAlt, FaUsers, FaBan } from "react-icons/fa";
import { Card } from "@lib/components/ui/card";

const BookingSummaryBar: React.FC = () => {
  const [upcomingVisible, setUpcomingVisible] = useState(true);
  const [upcomingRange, setUpcomingRange] = useState("1h");

  const demoBookings = [
    { time: "10:30 AM", customer: "Ayesha", staff: "Sara", service: "Facial" },
    { time: "11:00 AM", customer: "Noah", staff: "Alex", service: "Haircut" },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-row justify-center items-center p-4">
          <FaCalendarAlt className="text-blue-500 text-3xl mr-4" />{" "}
          {/* Icon on the left */}
          <div>
            <div className="text-sm text-gray-500">Bookings Today</div>
            <div className="text-xl font-bold">12</div>
          </div>
        </Card>

        <Card className="flex flex-row justify-center items-center p-4">
          <FaUsers className="text-purple-500 text-2xl mr-4" />
          <div>
            <div className="text-sm text-gray-500">Staff Status</div>
            <div className="text-sm">
              <span className="text-green-600 font-bold">5</span> Working /{" "}
              <span className="text-yellow-500 font-bold">2</span> Idle
            </div>
          </div>
        </Card>

        <Card className="flex flex-row justify-center items-center p-4">
          <FaBan className="text-red-400 text-2xl mr-4" />
          <div>
            <div className="text-sm text-gray-500">Cancelled / No-Shows</div>
            <div className="text-xl font-bold text-red-600">3</div>
          </div>
        </Card>
      </div>

      {/* 2. Upcoming Bookings Panel */}
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">
            Upcoming Bookings (next {upcomingRange})
          </h4>
          <div className="flex items-center space-x-2">
            <select
              value={upcomingRange}
              onChange={(e) => setUpcomingRange(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="1h">1 Hour</option>
              <option value="2h">2 Hours</option>
              <option value="4h">4 Hours</option>
              <option value="24h">24 Hours</option>
            </select>
            <button
              onClick={() => setUpcomingVisible(!upcomingVisible)}
              className="text-blue-600 text-sm underline"
            >
              {upcomingVisible ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {upcomingVisible && (
          <div className="space-y-2">
            {demoBookings.map((booking, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm border-b py-1"
              >
                <span>{booking.time}</span>
                <span>{booking.customer}</span>
                <span className="text-gray-500">{booking.staff}</span>
                <span className="text-blue-500">{booking.service}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSummaryBar;
