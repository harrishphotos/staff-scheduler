import React, { useEffect } from "react";
import {
  Navigate,
  Route,
  BrowserRouter,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminLayout from "./layout/AdminLayout";
import StaffManagement from "./pages/StaffManagement";
import Settings from "./pages/Settings";
import StaffAvailability from "./components/staff/views/StaffAvailability";
import Appointments from "./pages/Appointments";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route
            path="staff/:staffId/availability"
            element={<StaffAvailability />}
          />
          <Route path="settings" element={<Settings />} />
          <Route path="appointments" element={<Appointments />} />
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
