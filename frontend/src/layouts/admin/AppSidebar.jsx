import React, { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/admin/SidebarContext.jsx";
import { useAuthStore } from "../../store/authStore.js";

import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Calendar,
  MessageCircle,
  Megaphone,
  Users,
  Settings,
  LogOut,
  MoreHorizontal,
  Clock,        // for schedule availability
  FileText,     // for content management
} from "lucide-react";

/** ---------------------------
 *  Define sections here
 *  Add/modify freely.
 *  Each section has { title, key, items[] }.
 *  --------------------------- */
const sections = [
  {
    key: "main",
    title: "Menu",
    items: [
      { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} />, key: "dashboard" },
      { name: "Calendar", path: "/admin/calendar", icon: <CalendarDays size={18} />, key: "calendar" },
      { name: "Appointments", path: "/admin/appointments", icon: <ClipboardList size={18} />, key: "appointments" },
      { name: "Events", path: "/admin/events", icon: <Calendar size={18} />, key: "events" },
      { name: "Messages", path: "/admin/messages", icon: <MessageCircle size={18} />, key: "messages" },
      { name: "Announcement", path: "/admin/announcement", icon: <Megaphone size={18} />, key: "announcement" },
    ],
  },
  {
    key: "management",
    title: "Management",
    items: [
      { name: "Schedule Availability", path: "/admin/schedule", icon: <Clock size={18} />, key: "schedule" },
      { name: "Content Management", path: "/admin/content", icon: <FileText size={18} />, key: "content" },
      // add more management items here...
    ],
  },
  {
    key: "others",
    title: "Others",
    items: [
      { name: "Profile", path: "/admin/profile", icon: <Users size={18} />, key: "profile" },
      { name: "Settings", path: "/admin/settings", icon: <Settings size={18} />, key: "settings" },
      // Logout is an action, not a route
      { name: "Logout", icon: <LogOut size={18} />, isLogout: true, key: "logout" },
    ],
  },
];

/** Theme classes (red active theme) */
const baseItem =
  "group relative flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200";
const justify = (full) => (full ? "justify-start" : "lg:justify-center");
const inactiveItem =
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100";
const activeItem =
  "bg-red-50 text-red-600 dark:bg-red-600/10 dark:text-red-400";
const iconInactive =
  "text-gray-500 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-300";
const iconActive =
  "text-red-600 dark:text-red-400";

/** One item component */
const SidebarMenuItem = React.memo(function SidebarMenuItem({
  nav,
  isActive,
  showFullSidebar,
  onLogout,
  onAfterClick,
}) {
  const active = !nav.isLogout && nav.path ? isActive(nav.path) : false;
  const linkClassName = `${baseItem} ${justify(showFullSidebar)} ${active ? activeItem : inactiveItem}`;
  const iconClassName = `flex-shrink-0 ${active ? iconActive : iconInactive}`;

  if (nav.isLogout) {
    return (
      <li>
        <button
          type="button"
          className={linkClassName}
          onClick={async () => {
            onAfterClick?.();
            await onLogout?.();
          }}
          aria-label="Logout"
        >
          <span className={iconClassName}>{nav.icon}</span>
          {showFullSidebar && <span className="whitespace-nowrap">{nav.name}</span>}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={nav.path}
        className={linkClassName}
        onClick={onAfterClick}
        aria-current={active ? "page" : undefined}
      >
        <span className={iconClassName}>{nav.icon}</span>
        {showFullSidebar && <span className="whitespace-nowrap">{nav.name}</span>}
      </Link>
    </li>
  );
});

/** Section block with sticky header height respected */
const SectionBlock = ({ title, items, showFullSidebar, renderItem }) => (
  <div>
    <h2
      className={`mb-3 text-xs uppercase leading-5 text-gray-600 dark:text-slate-500 flex ${
        !showFullSidebar ? "lg:justify-center" : "justify-start"
      }`}
    >
      {showFullSidebar ? title : <MoreHorizontal className="w-5 h-5" />}
    </h2>
    <ul className="flex flex-col gap-2">
      {items.map((it) => renderItem(it))}
    </ul>
  </div>
);

export default function AppSidebar() {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();

  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const showFullSidebar = isExpanded || isHovered || isMobileOpen;
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // close drawer on mobile after any click
  const onAfterClick = () => {
    if (window.innerWidth < 1024 && isMobileOpen && typeof toggleMobileSidebar === "function") {
      toggleMobileSidebar();
    }
  };

  return (
    <aside
      className={`fixed top-0 h-screen mt-16 lg:mt-0 bg-white border-r border-gray-200 dark:bg-slate-900 dark:border-slate-700 z-[99] transition-all duration-300 ease-in-out overflow-hidden
        ${showFullSidebar ? "w-[260px]" : "w-[80px]"}
        ${isMobileOpen ? "left-0" : "-left-[290px] lg:left-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column layout to keep logo fixed and nav scrollable */}
      <div className="flex h-full flex-col">
        {/* Logo / brand (non-scrollable) */}
        <div className={`flex-none py-6 px-5 hidden lg:flex ${!showFullSidebar ? "lg:justify-center" : "justify-start"}`}>
          <Link to="/admin" className="flex items-center gap-3">
            {showFullSidebar ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img src="/logo.png" alt="logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold text-lg text-slate-900 dark:text-slate-100">ADMIN</h1>
                  <p className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">Management Panel</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="logo" className="w-10 h-10 object-contain" />
              </div>
            )}
          </Link>
        </div>

        {/* Scrollable nav area */}
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${showFullSidebar ? "custom-scrollbar": "scrollbar-hide"} px-4 pb-6 pt-4 lg:pt-0`}>
          <nav className="flex flex-col gap-6">
            {sections.map((section) => (
              <SectionBlock
                key={section.key}
                title={section.title}
                items={section.items}
                showFullSidebar={showFullSidebar}
                renderItem={(nav) => (
                  <SidebarMenuItem
                    key={nav.key}
                    nav={nav}
                    isActive={isActive}
                    showFullSidebar={showFullSidebar}
                    onLogout={onLogout}
                    onAfterClick={onAfterClick}
                  />
                )}
              />
            ))}
          </nav>
          {/* Bottom spacer so last item isn't tight to edge */}
          <div className="h-4" />
        </div>
      </div>
    </aside>
  );
}
