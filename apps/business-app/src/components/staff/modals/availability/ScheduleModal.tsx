import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  Schedule,
  CreateScheduleRequest,
} from "../../../../types/availability";
import ScheduleForm from "../../forms/availability/ScheduleForm";

interface ScheduleModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  schedule: Schedule | null;
  employeeId: string;
  onClose: () => void;
  onSubmit: (scheduleData: CreateScheduleRequest) => void;
  onDelete?: (scheduleId: string) => void;
  loading: boolean;
  error: string | null;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  mode,
  schedule,
  employeeId,
  onClose,
  onSubmit,
  onDelete,
  loading,
  error,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {mode === "add" ? "Add Work Schedule" : "Edit Work Schedule"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set up regular work hours for the selected day(s)
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ScheduleForm
                initialData={schedule}
                employeeId={employeeId}
                onSubmit={onSubmit}
                onDelete={onDelete}
                loading={loading}
                error={error}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleModal;
