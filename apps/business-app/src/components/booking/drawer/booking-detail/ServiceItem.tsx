// File: src/components/ServiceItem.tsx
import { Service } from "apps/business-app/src/types/booking";
import { Staff } from "apps/business-app/src/types/staff";
import { format } from "date-fns";
import React from "react";

interface ServiceItemProps {
  staffList: Staff[];
  service: Service;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service, staffList }) => {
  const staff = staffList.find((s) => s.id === service.staff);
  return (
    <div className="flex justify-between items-center bg-slate-600/30 p-2 rounded-lg text-sm">
      <div>
        <span className="font-medium">{service.serviceId}</span>
        <span className="text-slate-400 ml-2">
          {format(new Date(service.start), "hh:mm a")} -{" "}
          {format(new Date(service.end), "hh:mm a")}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {/* Optionally show avatar */}
        {staff?.profilePic ? (
          <img
            src={staff.profilePic}
            alt="Staff"
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
            {staff ? staff.firstName.charAt(0) : "?"}
          </div>
        )}
        <span className="text-right text-blue-400">
          {staff
            ? `${staff.firstName} ${staff.lastName || ""}`.trim()
            : "Unknown"}
        </span>
      </div>
    </div>
  );
};

export default ServiceItem;
