import { NavLink, Link, useLocation } from "react-router-dom";
import { useMemo, useState, useRef, useEffect } from "react";
import {
    ChevronDown,
    User,
    LogOut,
    Settings,
    LogIn,
    UserPlus,
    MessageSquare,
    Menu,
    X,
    BellRing,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api/api"; // ✅ ADDED: import your centralized axios instance

/* ===================================================
   🧭 USER MENU COMPONENT
=================================================== */
function UserMenu({ user, onLogout, compact = false }) {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    /* 🔸 Close dropdown on outside click / Escape */
    useEffect(() => {
        function onDocClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    /* 🔸 Fetch unread count initially + refresh every 30s */
    useEffect(() => {
        if (!user) return;
        async function fetchUnread() {
            try {
                const res = await api.get("/notifications/my");
                if (res.data.success && Array.isArray(res.data.notifications)) {
                    const unread = res.data.notifications.filter((n) => !n.isRead).length;
                    setUnreadCount(unread);
                    // ✅ keep localStorage synced so NotificationPanel can clear it
                    localStorage.setItem("unreadCount", unread);
                }
            } catch (err) {
                console.warn("⚠️ Failed to load unread notifications:", err.message);
            }
        }
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // recheck every 30s
        return () => clearInterval(interval);
    }, [user]);

    /* 🔸 🔁 Live sync from NotificationPanel */
    useEffect(() => {
        function handleUnreadUpdate() {
            const count = Number(localStorage.getItem("unreadCount") || 0);
            setUnreadCount(count);
        }
        window.addEventListener("unread-updated", handleUnreadUpdate);
        return () => window.removeEventListener("unread-updated", handleUnreadUpdate);
    }, []);

    const initial = user?.name ? String(user.name).charAt(0).toUpperCase() : null;
    const hasNotifications = unreadCount > 0;

    return (
        <div className="relative" ref={ref}>
            {/* 🔹 Avatar + Indicator */}
            <button
                type="button"
                className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] leading-tight
                    bg-white hover:bg-gray-50 text-gray-700 hover:text-secondary 
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40
                    ${compact ? "w-full justify-between" : ""}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <div className="relative h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-visible">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name || "User avatar"}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : initial ? (
                        <span className="text-sm font-medium text-gray-700">{initial}</span>
                    ) : (
                        <User className="h-4 w-4 text-gray-600" />
                    )}

                    {/* 🔴 Notification bubble (outside avatar corner) */}
                    {hasNotifications && (
                        <span
                            className="absolute -top-[6px] -right-[6px]
                                flex items-center justify-center
                                h-[18px] min-w-[18px] px-[4px]
                                text-[10px] font-bold text-white
                                bg-red-500 rounded-full
                                border-[1.5px] border-white
                                shadow-sm z-20"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>

                <span className="text-[14px] max-w-[10rem] truncate">{user?.name || "User"}</span>
                <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {/* ▼ Dropdown */}
            <div
                className={`absolute right-0 mt-3 w-72 rounded-lg bg-white shadow-lg border border-gray-200 origin-top-right transform transition
                    ${open ? "opacity-100 scale-100 z-50" : "pointer-events-none opacity-0 scale-95"}`}
                role="menu"
            >
                {user ? (
                    <div className="py-3">
                        {/* User Info */}
                        <div className="flex items-center gap-3 px-4">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name || "User avatar"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-gray-700">
                                        {(user?.name || "U").charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[14px] font-medium text-gray-900 truncate">
                                    {user?.name || "User"}
                                </p>
                                {user?.title && (
                                    <p className="text-[13px] text-gray-500 truncate">{user.title}</p>
                                )}
                            </div>
                        </div>

                        <div className="my-3 h-px bg-gray-200" />

                   

                        <NavLink
                            to="/settings/security"
                            className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <Settings className="h-4 w-4" /> Account & Security
                        </NavLink>

                        <div className="my-3 h-px bg-gray-200" />

                        <NavLink
                            to="/settings/appointments"
                            className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <MessageSquare className="h-4 w-4" /> My Appointments
                        </NavLink>

                        {/* 🔔 Notifications with dynamic count */}
                        <NavLink
                            to="/settings/notification"
                            className="relative flex items-center justify-between px-4 py-2.5 text-[14px] text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => {
                                setUnreadCount(0);
                                localStorage.setItem("unreadCount", 0);
                                window.dispatchEvent(new Event("unread-updated"));
                                setOpen(false);
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <BellRing className="h-4 w-4" />
                                <span>Notifications</span>
                            </div>
                            {hasNotifications && (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium text-white bg-red-500 rounded-full">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </NavLink>

                        <div className="my-3 h-px bg-gray-200" />

                        <button
                            onClick={async () => {
                                setOpen(false);
                                try {
                                    await onLogout?.();
                                } catch { }
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" /> Log Out
                        </button>
                    </div>
                ) : (
                    <div className="py-2">
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2.5 text-[14px] transition ${isActive
                                    ? "text-secondary font-medium"
                                    : "text-gray-700 hover:text-secondary hover:bg-gray-50"
                                }`
                            }
                            onClick={() => setOpen(false)}
                        >
                            <LogIn className="h-4 w-4" /> Login
                        </NavLink>
                        <NavLink
                            to="/signup"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2.5 text-[14px] transition ${isActive
                                    ? "text-secondary font-medium"
                                    : "text-gray-700 hover:text-secondary hover:bg-gray-50"
                                }`
                            }
                            onClick={() => setOpen(false)}
                        >
                            <UserPlus className="h-4 w-4" /> Sign Up
                        </NavLink>
                    </div>
                )}
            </div>
        </div>
    );
}


/* ===================================================
   🌟 HEADER COMPONENT
=================================================== */
export default function Header({ user, onLogout }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
        setServicesOpen(false);
        setAboutOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) setMobileOpen(false);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const { servicesActive, aboutActive } = useMemo(() => {
        const path = location.pathname || "/";
        return {
            servicesActive: path.startsWith("/services"),
            aboutActive: path.startsWith("/about"),
        };
    }, [location.pathname]);

    const baseLink = "transition text-gray-700 hover:text-secondary";
    const activeLink = "text-secondary font-medium";
    const navLinkClass = ({ isActive }) =>
        isActive ? `${baseLink} ${activeLink}` : baseLink;

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            {/* Top bar */}
            <motion.div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="flex items-center justify-between py-5 lg:py-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3">
                        <img
                            src="/logotest1.webp"
                            alt="Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-7 xl:gap-8 relative text-[15px] leading-relaxed">
                        <NavLink to="/" end className={navLinkClass}>
                            Home
                        </NavLink>

                        <div className="relative group">
                            <button
                                type="button"
                                className={`flex items-center gap-1 ${servicesActive ? activeLink : "text-gray-700"
                                    } transition group-hover:text-secondary`}
                            >
                                <span>Services</span>
                                <ChevronDown className="w-4 h-4 transform transition-transform duration-200 group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 mt-3 w-52 bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-20">
                                <NavLink
                                    to="/services/generalinfo"
                                    className={({ isActive }) =>
                                        `block px-4 py-2.5 text-[14px] leading-relaxed transition ${isActive
                                            ? "bg-gray-50 text-secondary"
                                            : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    General Information
                                </NavLink>
                                <NavLink
                                    to="/services/appointments/terms"
                                    className={({ isActive }) =>
                                        `block px-4 py-2.5 text-[14px] leading-relaxed transition ${isActive
                                            ? "bg-gray-50 text-secondary"
                                            : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Schedule Appointment
                                </NavLink>
                                <NavLink
                                    to="/document-request"
                                    className={({ isActive }) =>
                                        `block px-4 py-2.5 text-[14px] leading-relaxed transition ${isActive
                                            ? "bg-gray-50 text-secondary"
                                            : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Request Document
                                </NavLink>
                            </div>
                        </div>

                        <NavLink to="/about" className={navLinkClass}>
                            About
                        </NavLink>

                        <NavLink to="/contact" className={navLinkClass}>
                            Contact
                        </NavLink>

                        <NavLink to="/event" className={navLinkClass}>
                            Events & News
                        </NavLink>

                        <NavLink to="/announcements" className={navLinkClass}>
                            Announcements
                        </NavLink>
                    </nav>

                    {/* Desktop Auth */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <UserMenu user={user} onLogout={onLogout} />
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className="text-[14px] text-gray-700 hover:text-secondary"
                                >
                                    Login
                                </NavLink>
                                <Link
                                    to="/signup"
                                    className="bg-secondary text-white px-4 py-2 rounded-md text-[14px] hover:opacity-90"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                    >
                        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </motion.div>

            {/* Mobile Panel */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        id="mobile-nav"
                        className="lg:hidden border-t border-gray-200 bg-white"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <nav className="px-4 py-4 text-[15px] leading-relaxed">
                            <NavLink
                                to="/"
                                end
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2.5 ${isActive
                                        ? "text-secondary font-medium"
                                        : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Home
                            </NavLink>

                            {/* Services Accordion */}
                            <button
                                type="button"
                                onClick={() => setServicesOpen((o) => !o)}
                                className="flex w-full items-center justify-between px-3 py-2.5 text-gray-700 hover:text-secondary"
                            >
                                <span>Services</span>
                                <ChevronDown
                                    className={`h-5 w-5 transition ${servicesOpen ? "rotate-180" : ""}`}
                                />
                            </button>
                            <div className={`${servicesOpen ? "block" : "hidden"} pl-4`}>
                                <NavLink
                                    to="/services/generalinfo"
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-3 py-2.5 text-[14px] ${isActive
                                            ? "text-secondary font-medium"
                                            : "text-gray-700 hover:text-secondary"
                                        }`
                                    }
                                >
                                    General Information
                                </NavLink>
                                <NavLink
                                    to="/services/appointments/book"
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-3 py-2.5 text-[14px] ${isActive
                                            ? "text-secondary font-medium"
                                            : "text-gray-700 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Schedule Appointment
                                </NavLink>
                                <NavLink
                                    to="/document-request"
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `block px-3 py-2.5 text-[14px] ${isActive
                                            ? "text-secondary font-medium"
                                            : "text-gray-700 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Request Document
                                </NavLink>
                            </div>

                            <NavLink
                                to="/about"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2.5 ${isActive
                                        ? "text-secondary font-medium"
                                        : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                About
                            </NavLink>

                            <NavLink
                                to="/contact"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2.5 ${isActive
                                        ? "text-secondary font-medium"
                                        : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Contact
                            </NavLink>

                            <NavLink
                                to="/event"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2.5 ${isActive
                                        ? "text-secondary font-medium"
                                        : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Events & News
                            </NavLink>

                            <NavLink
                                to="/announcements"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2.5 ${isActive
                                        ? "text-secondary font-medium"
                                        : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Announcements
                            </NavLink>

                            <div className="my-3 h-px bg-gray-200" />

                            {user ? (
                                <>
                                  
                                    <NavLink
                                        to="/settings/security"
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `block px-3 py-2.5 ${isActive
                                                ? "text-secondary font-medium"
                                                : "text-gray-700 hover:text-secondary"
                                            }`
                                        }
                                    >
                                        Account & Security
                                    </NavLink>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await onLogout?.();
                                            } finally {
                                                setMobileOpen(false);
                                            }
                                        }}
                                        className="block w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50"
                                    >
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <NavLink
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            `block px-3 py-2.5 ${isActive
                                                ? "text-secondary font-medium"
                                                : "text-gray-700 hover:text-secondary"
                                            }`
                                        }
                                    >
                                        Login
                                    </NavLink>
                                    <NavLink
                                        to="/signup"
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-3 py-2.5 text-white bg-secondary rounded-md text-center mt-2"
                                    >
                                        Sign Up
                                    </NavLink>
                                </>
                            )}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
