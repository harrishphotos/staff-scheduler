// File: src/components/ProfileStatus.tsx
import React from "react";
import { User, Phone } from "lucide-react";
import { Booking } from "apps/business-app/src/types/booking";

const ProfileStatus: React.FC<{ booking: Booking }> = ({ booking }) => (
  <div className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg">
    {booking.profilePic ? (
      <img
        src={booking.profilePic}
        alt="Profile"
        className="w-12 h-12 rounded-full border-2 border-white"
      />
    ) : (
      <User className="w-12 h-12 text-slate-400" />
    )}
    <div>
      <div className="font-medium">{booking.customer}</div>
      {booking.phone && (
        <div className="flex items-center text-slate-400">
          <Phone size={14} className="mr-1" /> {booking.phone}
        </div>
      )}
      <span
        className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full font-semibold ${
          booking.bookingStatus === "Confirmed"
            ? "bg-green-900 text-green-300"
            : booking.bookingStatus === "Pending"
            ? "bg-yellow-900 text-yellow-300"
            : "bg-red-900 text-red-300"
        }`}
      >
        {booking.bookingStatus}
      </span>
    </div>
  </div>
);

export default ProfileStatus;
