// File: src/components/BookingCard.tsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import ServiceItem from "./ServiceItem";
import ProfileStatus from "./ProfileStatus";
import PaymentInfo from "./PaymentInfo";
import { Booking } from "apps/business-app/src/types/booking";
import { Staff } from "apps/business-app/src/types/staff";

interface BookingCardProps {
  booking: Booking;
  staffList: Staff[];
  isExpanded: boolean;
  onToggle: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  staffList,
  isExpanded,
  onToggle,
}) => (
  <div
    className="relative pl-12 group cursor-pointer"
    onClick={onToggle}
    role="button"
    aria-expanded={isExpanded}
  >
    <div className="absolute left-4 top-2 w-3 h-3 bg-blue-400 rounded-full border-2 border-white group-hover:scale-110 transition" />
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-5 shadow-sm border border-slate-700 hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{booking.customer}</h3>
        <span className="text-sm text-slate-400">
          {format(new Date(booking.start), "hh:mm a")} -{" "}
          {format(new Date(booking.end), "hh:mm a")}
        </span>
      </div>
      <div className="space-y-2 mt-3">
        {booking.services.map((s, idx) => (
          <ServiceItem key={idx} service={s} staffList={staffList} />
        ))}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 border-t border-slate-600 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          >
            <ProfileStatus booking={booking} />
            <PaymentInfo booking={booking} />
            {booking.note && (
              <blockquote className="md:col-span-2 p-3 italic border-l-4 border-slate-600 text-slate-300 rounded-lg bg-slate-900">
                “{booking.note}”
              </blockquote>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition flex space-x-2">
        <Phone
          className="w-5 h-5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); /* call action */
          }}
        />
        <Mail
          className="w-5 h-5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); /* email action */
          }}
        />
      </div>
    </div>
  </div>
);

export default BookingCard;
