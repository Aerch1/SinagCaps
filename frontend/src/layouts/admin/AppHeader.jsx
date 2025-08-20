// src/layouts/admin/AppHeader.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    X as IconClose,
    Menu as IconMenu,
    Search as IconSearch,
    Command as IconCommand,
    MoreHorizontal as IconMore,
    User as IconUser,
    Settings as IconSettings,
    LogOut as IconLogout,
    Sun as IconSun,
    Moon as IconMoon,
} from "lucide-react";

import { useSidebar } from "../../context/admin/SidebarContext";
import ThemeToggleButton from "../../components/ui/ThemeToggleButton";
import { useTheme } from "../../context/admin/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import  UserDropdown  from "../../components/admin/header/UserDropdown";
import  NotificationDropdown  from "../../components/admin/header/NotificationDropdown";

export default function AppHeader() {
    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
    const { logout } = useAuthStore();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const panelRef = useRef(null);
    const inputRef = useRef(null);

    const handleToggleSidebar = useCallback(() => {
        if (window.innerWidth >= 1024) toggleSidebar();
        else toggleMobileSidebar();
    }, [toggleSidebar, toggleMobileSidebar]);

    const toggleApplicationMenu = useCallback(() => {
        setApplicationMenuOpen((prev) => !prev);
    }, []);

    const closeApplicationMenu = useCallback(() => {
        setApplicationMenuOpen(false);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") setApplicationMenuOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        const onDocClick = (e) => {
            if (isApplicationMenuOpen && panelRef.current && !panelRef.current.contains(e.target)) {
                setApplicationMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [isApplicationMenuOpen]);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <header className="sticky top-0 z-[100] border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 lg:hidden">
                <div className="flex items-center gap-3">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-800"
                        onClick={handleToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        {isMobileOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
                    </button>

                    {/* Mobile brand (optional) */}
                    <Link to="/admin" className="flex items-center gap-2">
                        <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">ADMIN</span>
                    </Link>
                </div>

                <button
                    onClick={toggleApplicationMenu}
                    aria-expanded={isApplicationMenuOpen}
                    aria-haspopup="menu"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-800"
                    aria-label="Open menu"
                >
                    <IconMore size={20} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isApplicationMenuOpen && (
                <>
                    {/* Dim background so panel is visible & blocks clicks behind */}
                    <div className="fixed inset-0 z-[110]  lg:hidden" onClick={closeApplicationMenu} />
                    <div
                        ref={panelRef}
                        role="dialog"
                        className="absolute right-4 top-full z-[120] mt-2 w-[min(20rem,90vw)] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-300 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800 lg:hidden"
                    >
                        {/* User header */}
                        <div className="flex items-center gap-3 rounded-xl border-b border-gray-300 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-700">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                                <IconUser size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Admin User</p>
                                <p className="truncate text-xs text-gray-500 dark:text-slate-400">Administrator</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-1 p-2">
                            {/* Theme toggle row with text label */}
                            <button
                                type="button"
                                onClick={() => {
                                    toggleTheme();
                                    closeApplicationMenu();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label={isDark ? "Toggle light mode" : "Toggle dark mode"}
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700">
                                    {isDark ? (
                                        <IconSun size={16} className="text-gray-600 dark:text-slate-300" />
                                    ) : (
                                        <IconMoon size={16} className="text-gray-600 dark:text-slate-300" />
                                    )}
                                </div>
                                <span className="truncate">{isDark ? "Toggle light mode" : "Toggle dark mode"}</span>
                            </button>

                            {/* Notifications (mobile modal) */}
                            <div className="w-full">
                                <NotificationDropdown isMobile onOpen={closeApplicationMenu} />
                            </div>

                            {/* Profile */}
                            <Link
                                to="/admin/profile"
                                onClick={closeApplicationMenu}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700">
                                    <IconUser size={16} className="text-gray-600 dark:text-slate-400" />
                                </div>
                                <span>Profile</span>
                            </Link>

                            {/* Settings */}
                            <Link
                                to="/admin/settings"
                                onClick={closeApplicationMenu}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-slate-700">
                                    <IconSettings size={16} className="text-gray-600 dark:text-slate-400" />
                                </div>
                                <span>Settings</span>
                            </Link>

                            {/* Logout */}
                            <button
                                onClick={async () => {
                                    closeApplicationMenu();
                                    await handleLogout();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-600/10"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-red-600/20">
                                    <IconLogout size={16} className="text-gray-600 dark:text-red-400" />
                                </div>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Desktop Header */}
            <div className="hidden items-center justify-between px-6 py-4 lg:flex">
                {/* Left: sidebar toggle + search */}
                <div className="flex items-center gap-4">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200 dark:text-slate-400 dark:hover:bg-slate-800"
                        onClick={handleToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <IconMenu size={20} />
                    </button>

                    <div className="relative">
                        <IconSearch
                            size={16}
                            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? "text-gray-600 dark:text-slate-300" : "text-gray-500 dark:text-slate-500"
                                }`}
                        />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search appointments, events..."
                            className={`h-10 w-80 rounded-lg border bg-gray-100 pl-10 pr-16 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400/12 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 ${isSearchFocused ? "border-gray-300 dark:border-gray-600" : "border-gray-300 dark:border-slate-600"
                                }`}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <kbd className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                <IconCommand size={10} />
                                K
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggleButton />
                    <NotificationDropdown />
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}
