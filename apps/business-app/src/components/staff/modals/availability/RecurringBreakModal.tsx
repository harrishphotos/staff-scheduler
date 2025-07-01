import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  RecurringBreak,
  CreateRecurringBreakRequest,
} from "../../../../types/availability";
import RecurringBreakForm from "../../forms/availability/RecurringBreakForm";

interface RecurringBreakModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  recurringBreak: RecurringBreak | null;
  employeeId: string;
  onClose: () => void;
  onSubmit: (breakData: CreateRecurringBreakRequest) => void;
  onDelete?: (breakId: string) => void;
  loading: boolean;
  error: string | null;
}

const RecurringBreakModal: React.FC<RecurringBreakModalProps> = ({
  isOpen,
  mode,
  recurringBreak,
  employeeId,
  onClose,
  onSubmit,
  onDelete,
  loading,
  error,
}) => {
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Simplified Backdrop - No blur for performance */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Modal - Optimized */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{
              duration: 0.12,
              ease: [0.4, 0, 0.2, 1],
              layout: { duration: 0 },
            }}
            className="relative bg-black/95 border border-white/15 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col will-change-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-white/15">
              <div>
                <h2 className="text-xl font-semibold text-white/95">
                  {mode === "add"
                    ? "Add Recurring Break"
                    : "Edit Recurring Break"}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  Set up regular break times (lunch, coffee breaks, etc.)
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-full transition-colors duration-100"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <RecurringBreakForm
                initialData={recurringBreak}
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

  // Render at document root using portal
  return createPortal(modalContent, document.body);
};

export default RecurringBreakModal;
