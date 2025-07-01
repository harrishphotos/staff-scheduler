import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const AdminLayout: React.FC = () => {
  const location = useLocation();

  // Reset scroll position when route changes
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 relative overflow-y-auto w-full h-full bg-gray-50 dark:bg-gray-900"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
