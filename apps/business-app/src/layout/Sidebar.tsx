import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { applyTheme, getInitialTheme } from "@lib/utils/themeChange.util";
import {
  FiMenu,
  FiHome,
  FiStar,
  FiTarget,
  FiSettings,
  FiMessageSquare,
  FiMoon,
  FiSun,
} from "react-icons/fi";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Dark/Light theme management
  const [theme, setTheme] = useState<string>(getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const renderNavLink = (to: string, label: string, icon: React.ReactNode) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 my-1 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-primary/10 text-primary dark:bg-primary/20 shadow-sm"
            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`
      }
    >
      <span className="flex items-center justify-center w-6 h-6 mr-3">
        {icon}
      </span>
      {isExpanded && (
        <span className="transition-opacity duration-200">{label}</span>
      )}
    </NavLink>
  );

  return (
    <aside
      className={`${
        isExpanded ? "w-56" : "w-20"
      } transition-all duration-300 ease-in-out min-h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between`}
    >
      <div>
        {/* Header and Brand */}
        <div
          className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 ${
            isExpanded ? "justify-between" : "justify-center"
          }`}
        >
          {isExpanded ? (
            <h1 className="text-lg font-semibold text-primary dark:text-primary-light font-press">
              SaloBook-Business
            </h1>
          ) : (
            <div></div>
          )}
          <button
            className={`text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isExpanded
                ? "p-1.5"
                : "p-1.5 flex items-center justify-center w-6 h-6"
            }`}
            onClick={toggleSidebar}
            aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <FiMenu size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          className={`p-3 space-y-1 ${
            !isExpanded && "px-0 flex flex-col items-center"
          }`}
        >
          <div
            className={`text-xs font-medium text-gray-400 dark:text-gray-500 py-2 px-4 ${
              !isExpanded && "sr-only"
            }`}
          >
            DASHBOARD
          </div>
          {renderNavLink("/overview", "Overview", <FiHome size={18} />)}

          <div
            className={`text-xs font-medium text-gray-400 dark:text-gray-500 py-2 px-4 mt-4 ${
              !isExpanded && "sr-only"
            }`}
          >
            MANAGEMENT
          </div>
          {renderNavLink("/staff", "Staffs", <FiStar size={18} />)}
          {renderNavLink("/service", "Services", <FiTarget size={18} />)}
          {renderNavLink("/review", "Reviews", <FiMessageSquare size={18} />)}

          {
            <>
              <div
                className={`text-xs font-medium text-gray-400 dark:text-gray-500 py-2 px-4 mt-4 ${
                  !isExpanded && "sr-only"
                }`}
              >
                ADMIN
              </div>
              {renderNavLink("/settings", "Settings", <FiSettings size={18} />)}
            </>
          }
        </nav>
      </div>

      {/* Theme Toggle - Single Button with dynamic icon */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex items-center justify-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
