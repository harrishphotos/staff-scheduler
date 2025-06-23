// File: src/components/PaymentInfo.tsx
import React from "react";
import { Tag, CreditCard } from "lucide-react";
import { Booking } from "apps/business-app/src/types/booking";

const PaymentInfo: React.FC<{ booking: Booking }> = ({ booking }) => (
  <div className="bg-slate-800 p-3 rounded-lg space-y-2">
    <h4 className="text-sm font-semibold text-slate-300">Payment</h4>
    <div className="flex items-center">
      <Tag className="w-4 h-4 text-slate-400 mr-1" />
      <span>Total:</span>
      <span className="ml-auto font-medium">
        Rs.{booking.totalPrice.toFixed(2)}
      </span>
    </div>
    {booking.advancePayment && (
      <div className="flex items-center">
        <CreditCard className="w-4 h-4 text-slate-400 mr-1" />
        <span>Advance:</span>
        <span className="ml-auto font-medium">
          ${booking.advancePayment.toFixed(2)}
        </span>
      </div>
    )}
  </div>
);

export default PaymentInfo;
