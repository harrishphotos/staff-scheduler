import toast from "react-hot-toast";

// Modern toast styling constants
const baseStyle = {
  background: "rgba(0, 0, 0, 0.95)",
  color: "#ffffff",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "16px 20px",
  maxWidth: "420px",
  minWidth: "320px",
  backdropFilter: "blur(10px)",
};

// Custom toast utility with modern styling and animations
export const customToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, {
      style: {
        ...baseStyle,
        border: "1px solid rgba(34, 197, 94, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
      },
      iconTheme: {
        primary: "#22c55e",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
      duration: 4000,
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      style: {
        ...baseStyle,
        border: "1px solid rgba(239, 68, 68, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)",
      },
      iconTheme: {
        primary: "#ef4444",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
      duration: 5000,
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      style: {
        ...baseStyle,
        border: "1px solid rgba(107, 114, 128, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1)",
      },
      iconTheme: {
        primary: "#6b7280",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return toast(message, {
      icon: "ℹ️",
      style: {
        ...baseStyle,
        border: "1px solid rgba(59, 130, 246, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)",
      },
      duration: 4000,
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return toast(message, {
      icon: "⚠️",
      style: {
        ...baseStyle,
        border: "1px solid rgba(245, 158, 11, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.1)",
      },
      duration: 4000,
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) => {
    return toast.promise(promise, msgs, {
      style: baseStyle,
      success: {
        style: {
          border: "1px solid rgba(34, 197, 94, 0.3)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
        },
        iconTheme: {
          primary: "#22c55e",
          secondary: "rgba(0, 0, 0, 0.95)",
        },
      },
      error: {
        style: {
          border: "1px solid rgba(239, 68, 68, 0.3)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "rgba(0, 0, 0, 0.95)",
        },
      },
      loading: {
        style: {
          border: "1px solid rgba(107, 114, 128, 0.3)",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1)",
        },
        iconTheme: {
          primary: "#6b7280",
          secondary: "rgba(0, 0, 0, 0.95)",
        },
      },
      ...options,
    });
  },

  // Utility functions
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  remove: (toastId?: string) => toast.remove(toastId),
};

// Export the original toast as well for backwards compatibility
export { toast };
export default customToast;
