import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  index: number;
  active: boolean;
  completed: boolean;
  showLine: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  index,
  active,
  completed,
  showLine,
}) => {
  return (
    <div className="flex flex-col items-center mr-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm z-10 mb-1 border-2 transition-all duration-200 ${
          completed
            ? "bg-green-500 text-white border-green-500"
            : active
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-slate-600 text-white border-slate-400"
        }`}
      >
        {completed ? <Check size={16} /> : index + 1}
      </div>
      {/* Show connector line only if this is current step */}
      {active && index < showLine && (
        <div className="w-px flex-1 border-l border-dashed border-slate-400" />
      )}
    </div>
  );
};

export default StepIndicator;
