import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

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
    <div className="h-screen overflow-hidden bg-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-white/2 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content - Full Screen */}
      <main
        id="main-content"
        className="relative h-full overflow-y-auto w-full"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
