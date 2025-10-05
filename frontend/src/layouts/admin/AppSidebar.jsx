"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/admin/SidebarContext.jsx";
import { useAuthStore } from "../../store/authStore.js";

import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FileArchive,
  MessageCircle,
  UserCog,
  Settings,
  LogOut,
  MoreHorizontal,
  Clock,
  Layers,
  BarChart3,
  UserCircle,
  FileText,
  ChevronDown,
} from "lucide-react";

/** ---------------------------
 *  Sections
 *  --------------------------- */
const sections = [
  {
    key: "main",
    title: "Menu",
    items: [
      { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} />, key: "dashboard" },
      { name: "Calendar", path: "/admin/calendar", icon: <CalendarDays size={18} />, key: "calendar" },
      {
        name: "Appointments",
        path: "/admin/appointments?status=all",
        icon: <ClipboardList size={18} />,
        key: "appointments",
        children: [
          { name: "All Appointments", path: "/admin/appointments?status=all", status: "all", key: "appointments-all" },
          { name: "Pending", path: "/admin/appointments?status=pending", status: "pending", key: "appointments-pending" },
          { name: "Approved", path: "/admin/appointments?status=approved", status: "approved", key: "appointments-approved" },
          { name: "Completed", path: "/admin/appointments?status=completed", status: "completed", key: "appointments-completed" },
          { name: "Cancelled", path: "/admin/appointments?status=cancelled", status: "cancelled", key: "appointments-cancelled" },
        ],
      },
      { name: "Documents", path: "/admin/documents", icon: <FileArchive size={18} />, key: "documents" },
      { name: "Messages", path: "/admin/messages", icon: <MessageCircle size={18} />, key: "messages" },
    ],
  },
  {
    key: "management",
    title: "Management",
    items: [
      { name: "User Management", path: "/admin/users", icon: <UserCog size={18} />, key: "user-management" },
      { name: "Schedule Availability", path: "/admin/schedule", icon: <Clock size={18} />, key: "schedule" },
      { name: "Content Management", path: "/admin/content", icon: <Layers size={18} />, key: "content" },
      { name: "Reports", path: "/admin/report", icon: <BarChart3 size={18} />, key: "report" },
    ],
  },
  {
    key: "others",
    title: "Others",
    items: [
      { name: "Profile", path: "/admin/profile", icon: <UserCircle size={18} />, key: "profile" },
      { name: "Settings", path: "/admin/settings", icon: <Settings size={18} />, key: "settings" },
      { name: "Logout", icon: <LogOut size={18} />, isLogout: true, key: "logout" },
    ],
  },
];


/** Theme classes */
const baseItem =
  "group relative flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200";
const justify = (full) => (full ? "justify-start" : "lg:justify-center");
const inactiveItem = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
const activeItem = "bg-red-50 text-red-600";
const iconInactive = "text-gray-500 group-hover:text-gray-700";
const iconActive = "text-red-600";

/* ---------- Route helpers ---------- */
function useRouteInfo() {
  const { pathname, search } = useLocation();
  const status = useMemo(() => {
    const qs = new URLSearchParams(search);
    return qs.get("status") || "all";
  }, [search]);
  return { pathname, status, search };
}

/** One leaf item (no children) */
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
          {showFullSidebar && (
            <span className="whitespace-nowrap text-sm">{nav.name}</span>
          )}
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
        {showFullSidebar && (
          <span className="whitespace-nowrap text-sm">{nav.name}</span>
        )}
      </Link>
    </li>
  );
});

/** Collapsible parent with children */
function CollapsibleMenuItem({ nav, showFullSidebar, onAfterClick }) {
  const navigate = useNavigate();
  const { pathname, status } = useRouteInfo();
  const hasChildren = Array.isArray(nav.children) && nav.children.length > 0;

  const onAppointmentsPage = pathname === "/admin/appointments";
  const childActive =
    hasChildren &&
    onAppointmentsPage &&
    nav.children.some((c) => (c.status || "") === status);

  const parentActive = onAppointmentsPage || childActive;
  const [open, setOpen] = useState(childActive);
  useEffect(() => {
    setOpen(childActive);
  }, [childActive]);

  const canDropdown = showFullSidebar && hasChildren;
  const parentClass = `${baseItem} ${justify(showFullSidebar)} ${parentActive ? activeItem : inactiveItem}`;
  const iconClassName = `flex-shrink-0 ${parentActive ? iconActive : iconInactive}`;

  return (
    <li className="relative">
      <button
        type="button"
        className={`${parentClass} w-full`}
        onClick={() => {
          if (!canDropdown) {
            navigate(nav.path || "/admin/appointments?status=all");
            return;
          }
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-controls={`submenu-${nav.key}`}
      >
        <span className={iconClassName}>{nav.icon}</span>
        {showFullSidebar && (
          <>
            <span className="flex-1 text-left whitespace-nowrap text-sm">
              {nav.name}
            </span>
            {hasChildren && (
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""} text-gray-500`}
              />
            )}
          </>
        )}
      </button>

      {canDropdown && (
        <div
          id={`submenu-${nav.key}`}
          className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <ul className="mt-1 ml-6 flex flex-col gap-1 border-l p-2">
              {nav.children.map((child) => {
                const active = onAppointmentsPage && status === child.status;
                return (
                  <li key={child.key}>
                    <Link
                      to={child.path}
                      className={`block rounded-md px-2 py-1.5 text-sm transition-all duration-200 ${active ? activeItem : inactiveItem}`}
                      onClick={onAfterClick}
                    >
                      {child.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/** Section block */
const SectionBlock = ({ title, items, showFullSidebar, renderItem }) => (
  <div>
    <h2
      className={`mb-3 text-sm font-medium text-gray-700 flex ${!showFullSidebar ? "lg:justify-center" : "justify-start"}`}
    >
      {showFullSidebar ? title : <MoreHorizontal className="w-5 h-5" />}
    </h2>
    <ul className="flex flex-col gap-2">{items.map((it) => renderItem(it))}</ul>
  </div>
);

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const showFullSidebar = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback(
    (path) => {
      const targetPath = String(path || "").split("?")[0];
      return location.pathname === targetPath;
    },
    [location.pathname]
  );

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const onAfterClick = () => {
    if (window.innerWidth < 1024 && isMobileOpen && typeof toggleMobileSidebar === "function") {
      toggleMobileSidebar();
    }
  };

  return (
    <aside
      className={`fixed top-0 h-screen mt-16 lg:mt-0 bg-white border-r border-gray-200 z-[99] transition-all duration-300 ease-in-out overflow-hidden
        ${showFullSidebar ? "w-[260px]" : "w-[80px]"}
        ${isMobileOpen ? "left-0" : "-left-[290px] lg:left-0"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col">
        {/* Logo / brand */}
        <div
          className={`flex-none py-6 px-5 hidden lg:flex ${!showFullSidebar ? "lg:justify-center" : "justify-start"}`}
        >
          <Link to="/admin" className="flex items-center gap-3">
            {showFullSidebar ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-semibold text-lg text-slate-900">ADMIN</h1>
                  <p className="text-sm text-gray-500 whitespace-nowrap">Management Panel</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
            )}
          </Link>
        </div>

        {/* Scrollable nav area */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${showFullSidebar ? "custom-scrollbar" : "scrollbar-hide"} px-4 pb-6 pt-4 lg:pt-0`}
        >
          <nav className="flex flex-col gap-6">
            {sections.map((section) => (
              <SectionBlock
                key={section.key}
                title={section.title}
                items={section.items}
                showFullSidebar={showFullSidebar}
                renderItem={(nav) => {
                  if (nav.children?.length) {
                    return (
                      <CollapsibleMenuItem
                        key={nav.key}
                        nav={nav}
                        showFullSidebar={showFullSidebar}
                        onAfterClick={onAfterClick}
                      />
                    );
                  }
                  return (
                    <SidebarMenuItem
                      key={nav.key}
                      nav={nav}
                      isActive={isActive}
                      showFullSidebar={showFullSidebar}
                      onLogout={onLogout}
                      onAfterClick={onAfterClick}
                    />
                  );
                }}
              />
            ))}
          </nav>
          <div className="h-4" />
        </div>
      </div>
    </aside>
  );
}
