"use client";
import { NavLink } from "react-router-dom";

export default function SettingsSidebar() {
    const base =
        "block rounded-lg px-3 py-2 text-sm transition";
    const inactive =
        "text-gray-700 hover:bg-gray-50 hover:text-secondary";
    const active =
        "bg-gray-200 px-3 py-3  ";

    return (
     <aside className=" border-gray-200 border-r p-3 sm:p-4">
  <nav className="space-y-1">
    <NavLink
      to="/settings/profile"
      className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
    >
      Profile
    </NavLink>

    <NavLink
      to="/settings/security"
      className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
    >
      Account & Security
    </NavLink>

    <NavLink
      to="/settings/appointments"
      className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
    >
      My Appointments
    </NavLink>

    <NavLink
      to="/settings/notification"
      className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
    >
      Notifications
    </NavLink>
  </nav>
</aside>

    );
}
