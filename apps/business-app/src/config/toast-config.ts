import { ToasterProps } from "react-hot-toast";

export const toasterConfig: ToasterProps = {
  position: "top-right",
  reverseOrder: false,
  gutter: 8,
  containerStyle: {
    top: 24,
    right: 24,
  },
  toastOptions: {
    // Default options
    duration: 4000,
    className: "custom-toast",
    style: {
      background: "rgba(0, 0, 0, 0.95)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      padding: "16px 20px",
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      maxWidth: "420px",
      minWidth: "320px",
      backdropFilter: "blur(10px)",
    },
    // Success toasts
    success: {
      style: {
        background: "rgba(0, 0, 0, 0.95)",
        color: "#ffffff",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.1)",
      },
      iconTheme: {
        primary: "#22c55e",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
    },
    // Error toasts
    error: {
      style: {
        background: "rgba(0, 0, 0, 0.95)",
        color: "#ffffff",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)",
      },
      iconTheme: {
        primary: "#ef4444",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
    },
    // Loading toasts
    loading: {
      style: {
        background: "rgba(0, 0, 0, 0.95)",
        color: "#ffffff",
        border: "1px solid rgba(107, 114, 128, 0.3)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 114, 128, 0.1)",
      },
      iconTheme: {
        primary: "#6b7280",
        secondary: "rgba(0, 0, 0, 0.95)",
      },
    },
  },
};
