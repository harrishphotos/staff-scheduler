import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Staff } from "../../../types/staff";
import StaffForm from "../forms/StaffForm";

interface StaffModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  staff: Staff | null;
  onClose: () => void;
  onSubmit: (staffData: Omit<Staff, "id" | "createdAt" | "updatedAt">) => void;
  loading: boolean;
  error: string | null;
}

const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  mode,
  staff,
  onClose,
  onSubmit,
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
          transition={{ duration: 0.08, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              <h2 className="text-xl font-semibold text-white/95">
                {mode === "add" ? "Add New Staff Member" : "Edit Staff Member"}
              </h2>
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
              <StaffForm
                initialData={staff}
                onSubmit={onSubmit}
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

export default StaffModal;
