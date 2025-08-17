import { Outlet } from "react-router-dom";
import { useTheme } from "../context/admin/ThemeContext";
import { useSidebar } from "../context/admin/SidebarContext";
import AppHeader from "./admin/AppHeader";
import AppSidebar from "./admin/AppSidebar";
import Backdrop from "./admin/Backdrop";

export default function AdminLayout() {
  // scoped dark mode (no html mutation)
  const { isDark } = useTheme();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <Backdrop />

        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
            } ${isMobileOpen ? "ml-0" : ""}`}
        >
          <AppHeader />
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
