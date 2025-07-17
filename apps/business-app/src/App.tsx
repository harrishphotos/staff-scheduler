import React, { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { toasterConfig } from "./config/toast-config";
import AdminLayout from "./layout/AdminLayout";
import StaffManagement from "./pages/StaffManagement";
import StaffAvailability from "./components/staff/views/StaffAvailability";
import RequireAuth from "./routes/RequireAuth";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster {...toasterConfig} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="staff" />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route
              path="staff/:staffId/availability"
              element={<StaffAvailability />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

/**
 * Custom hook that scrolls to top when the URL pathname changes.
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

/**
 * A simple component that calls the useScrollToTop hook.
 */
export function ScrollToTop(): null {
  useScrollToTop();
  return null;
}
