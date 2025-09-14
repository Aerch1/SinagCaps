// src/layouts/AdminLayout.jsx
import { Outlet, useMatch } from "react-router-dom";
import { useTheme } from "../context/admin/ThemeContext";
import { useSidebar } from "../context/admin/SidebarContext";
import AppHeader from "./admin/AppHeader";
import AppSidebar from "./admin/AppSidebar";
import Backdrop from "./admin/Backdrop";
import { useEffect, useState } from "react";

// helper hook for screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}

export default function AdminLayout() {
  const { isDark } = useTheme();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const onDashboard = !!useMatch({ path: "/admin", end: true });
  const isMobile = useIsMobile(); // check if screen < 1024px

  return (
      <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <Backdrop />

        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[80px]"
            } ${isMobileOpen ? "ml-0" : ""}`}
        >
          {/* Always show header on mobile, but only show on /admin for desktop */}
          {(isMobile || onDashboard) && <AppHeader />}

          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
  );
}
