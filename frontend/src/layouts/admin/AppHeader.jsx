// src/layouts/admin/AppHeader.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    X as IconClose,
    Menu as IconMenu,
    MoreHorizontal as IconMore,
    User as IconUser,
    Settings as IconSettings,
    LogOut as IconLogout,
} from "lucide-react";

import { useSidebar } from "../../context/admin/SidebarContext";
import { useAuthStore } from "../../store/authStore";
import UserDropdown from "../../components/admin/header/UserDropdown";
import NotificationDropdown from "../../components/admin/header/NotificationDropdown";

export default function AppHeader() {
    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
    const panelRef = useRef(null);

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
            navigate("/", { replace: true });
        }
    };

    return (
        <header className="sticky top-0 z-[100] border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 lg:hidden">
                <div className="flex items-center gap-3">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200"
                        onClick={handleToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        {isMobileOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
                    </button>

                    <Link to="/admin" className="flex items-center gap-2">
                        <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
                        <span className="text-sm font-semibold text-slate-900">ADMIN</span>
                    </Link>
                </div>

                <button
                    onClick={toggleApplicationMenu}
                    aria-expanded={isApplicationMenuOpen}
                    aria-haspopup="menu"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200"
                    aria-label="Open menu"
                >
                    <IconMore size={20} />
                </button>
            </div>

            {/* Mobile Menu */}
            {isApplicationMenuOpen && (
                <>
                    <div className="fixed inset-0 z-[110] lg:hidden" onClick={closeApplicationMenu} />
                    <div
                        ref={panelRef}
                        role="dialog"
                        className="absolute right-4 top-full z-[120] mt-2 w-[min(20rem,90vw)] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-300 bg-white p-2 shadow-lg lg:hidden"
                    >
                        <div className="flex items-center gap-3 rounded-xl border-b border-gray-300 bg-gray-50 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
                                <IconUser size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">Admin User</p>
                                <p className="truncate text-xs text-gray-500">Administrator</p>
                            </div>
                        </div>

                        <div className="space-y-1 p-2">
                            <div className="w-full">
                                <NotificationDropdown isMobile onOpen={closeApplicationMenu} />
                            </div>

                            <Link
                                to="/admin/profile"
                                onClick={closeApplicationMenu}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
                                    <IconUser size={16} className="text-gray-600" />
                                </div>
                                <span>Profile</span>
                            </Link>

                            <Link
                                to="/admin/settings"
                                onClick={closeApplicationMenu}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
                                    <IconSettings size={16} className="text-gray-600" />
                                </div>
                                <span>Settings</span>
                            </Link>

                            <button
                                onClick={async () => {
                                    closeApplicationMenu();
                                    await handleLogout();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 transition-colors duration-200 hover:bg-red-50"
                            >
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200">
                                    <IconLogout size={16} className="text-gray-600" />
                                </div>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Desktop Header */}
            <div className="hidden items-center justify-between px-6 py-4 lg:flex">
                <div className="flex items-center gap-4">
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors duration-200 hover:bg-gray-200"
                        onClick={handleToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <IconMenu size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <NotificationDropdown />
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}
