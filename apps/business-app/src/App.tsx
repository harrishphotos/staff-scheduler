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
import ColdStartLoader from "./components/ColdStartLoader";
import { warmUpServices, checkServiceHealth } from "./api/axios";

const App: React.FC = () => {
  const [isColdStarting, setIsColdStarting] = useState(false);

  useEffect(() => {
    // Check if services are healthy on app load and warm them up if needed
    const initializeServices = async () => {
      try {
        // Quick health check first
        const isHealthy = await checkServiceHealth();
        
        if (!isHealthy) {
          console.log('[APP] Services appear to be sleeping, initiating warm-up...');
          setIsColdStarting(true);
          
          // Start warm-up process
          await warmUpServices();
          
          // Wait a bit for services to start responding
          setTimeout(() => {
            setIsColdStarting(false);
          }, 5000); // Minimum 5 seconds to show the loader
        } else {
          console.log('[APP] Services are healthy');
        }
      } catch (error) {
        console.log('[APP] Error checking service health:', error);
        // Don't show cold start loader for unexpected errors
      }
    };

    initializeServices();
  }, []);

  // Global error handler for axios interceptor
  useEffect(() => {
    const handleGlobalError = (event: CustomEvent) => {
      const error = event.detail;
      
      // Check if it's a cold start error
      const message = error?.message || error?.response?.data?.error || '';
      const coldStartIndicators = ['timeout', 'Service is unavailable', 'cold start timeout'];
      
      if (coldStartIndicators.some(indicator => 
          message.toLowerCase().includes(indicator.toLowerCase()))) {
        setIsColdStarting(true);
        
        // Auto-hide after 80 seconds (our max timeout)
        setTimeout(() => {
          setIsColdStarting(false);
        }, 80000);
      }
    };

    // Listen for custom cold start events
    window.addEventListener('coldstart-detected' as any, handleGlobalError);
    
    return () => {
      window.removeEventListener('coldstart-detected' as any, handleGlobalError);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster {...toasterConfig} />
      <ColdStartLoader 
        isVisible={isColdStarting} 
        duration={75} // Match our gateway timeout
      />
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
