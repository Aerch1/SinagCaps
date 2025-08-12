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
} from "lucide-react";

function UserMenu({ user, onLogout, compact = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

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

    const initial = user?.name ? String(user.name).charAt(0).toUpperCase() : null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 
          bg-white hover:bg-gray-50 text-gray-700 hover:text-secondary
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40
          ${compact ? "w-full justify-between" : ""}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name || "User avatar"}
                            className="h-full w-full object-cover"
                        />
                    ) : initial ? (
                        <span className="text-sm font-medium text-gray-700">{initial}</span>
                    ) : (
                        <User className="h-4 w-4 text-gray-600" />
                    )}
                </div>
                <span className="text-sm max-w-[10rem] truncate">{user?.name || "User"}</span>
                <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>

            <div
                className={`absolute right-0 mt-2 w-80 rounded-md bg-white shadow-xl border border-gray-200 origin-top-right transform transition
          ${open ? "opacity-100 scale-100 z-50" : "pointer-events-none opacity-0 scale-95"}`}
                role="menu"
            >
                {user ? (
                    <div className="py-3">
                        <div className="flex items-center  gap-3 px-4">
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
                            <div className="min-w-0 ">
                                <p className="text-sm font-medium  text-gray-900 truncate">
                                    {user?.name || "User"}
                                </p>
                                {user?.title && (
                                    <p className="text-xs  text-gray-500 truncate">{user.title}</p>
                                )}
                            </div>
                        </div>

                        <div className="my-3 h-px bg-gray-200" />

                        <NavLink
                            to="settings/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <User className="h-4 w-4" /> View Profile
                        </NavLink>
                        <NavLink
                            to="/settings/security"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <Settings className="h-4 w-4" /> Account Settings
                        </NavLink>

                        <div className="my-3 h-px bg-gray-200" />

                        <NavLink
                            to="settings/appointments"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <MessageSquare className="h-4 w-4" /> Manage Appointments
                        </NavLink>
                        <NavLink
                            to="settings/messages"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:text-secondary hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                        >
                            <MessageSquare className="h-4 w-4" /> Messages
                        </NavLink>

                        <div className="my-3 h-px bg-gray-200" />

                        <button
                            onClick={async () => {
                                setOpen(false);
                                try {
                                    await onLogout?.();
                                } catch { }
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" /> Log Out
                        </button>
                    </div>
                ) : (
                    <div className="py-2">
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                `flex items-center gap-2 px-4 py-2 text-sm transition ${isActive
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
                                `flex items-center gap-2 px-4 py-2 text-sm transition ${isActive
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

export default function Header({ user, onLogout }) {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
        setServicesOpen(false);
        setAboutOpen(false);
    }, [location.pathname]);

    // Optional: close mobile menu when viewport becomes desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) setMobileOpen(false); // lg breakpoint
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3">
                        <img
                            src="/logotest1.webp"
                            alt="Logo"
                            className="h-12 w-auto object-contain"
                        />
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-6 relative">
                        <NavLink to="/" end className={navLinkClass}>
                            Home
                        </NavLink>

                        {/* Services dropdown (desktop hover) */}
                        <div className="relative group">
                            <button
                                type="button"
                                className={`flex items-center gap-1 ${servicesActive ? activeLink : "text-gray-700"} transition group-hover:text-secondary`}
                            >
                                <span>Services</span>
                                <ChevronDown className="w-4 h-4 transform transition-transform duration-200 group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-20">
                                <NavLink
                                    to="/services/one"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 text-sm transition ${isActive ? "bg-gray-50 text-secondary" : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Service 1
                                </NavLink>
                                <NavLink
                                    to="/services/two"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 text-sm transition ${isActive ? "bg-gray-50 text-secondary" : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Service 2
                                </NavLink>
                            </div>
                        </div>

                        {/* About dropdown (desktop hover) */}
                        <div className="relative group">
                            <button
                                type="button"
                                className={`flex items-center gap-1 ${aboutActive ? activeLink : "text-gray-700"} transition group-hover:text-secondary`}
                            >
                                <span>About</span>
                                <ChevronDown className="w-4 h-4 transform transition-transform duration-200 group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-20">
                                <NavLink
                                    to="/about/mission"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 text-sm transition ${isActive ? "bg-gray-50 text-secondary" : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Our Mission
                                </NavLink>
                                <NavLink
                                    to="/about/team"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 text-sm transition ${isActive ? "bg-gray-50 text-secondary" : "hover:bg-gray-50 hover:text-secondary"
                                        }`
                                    }
                                >
                                    Our Team
                                </NavLink>
                            </div>
                        </div>

                        <NavLink to="/contact" className={navLinkClass}>
                            Contact
                        </NavLink>
                        <NavLink to="/event" className={navLinkClass}>
                            Event
                        </NavLink>
                    </nav>

                    {/* Desktop auth */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <UserMenu user={user} onLogout={onLogout} />
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className="text-sm text-gray-700 hover:text-secondary"
                                >
                                    Login
                                </NavLink>
                                <Link
                                    to="/signup"
                                    className="bg-secondary text-white px-4 py-2 rounded-md text-sm hover:opacity-90"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setMobileOpen((v) => !v)}
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                    >
                        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile panel (full-width, no rounded corners) */}
            <div
                id="mobile-nav"
                className={`lg:hidden border-t border-gray-200 bg-white transition-[max-height,opacity] duration-200 overflow-hidden ${mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <nav className="px-4 py-4">
                    {/* Primary links */}
                    <NavLink
                        to="/"
                        end
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                            }`
                        }
                    >
                        Home
                    </NavLink>

                    {/* Services accordion */}
                    <button
                        type="button"
                        onClick={() => setServicesOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-2 py-2 text-base text-gray-700 hover:text-secondary"
                        aria-expanded={servicesOpen}
                    >
                        <span>Services</span>
                        <ChevronDown className={`h-5 w-5 transition ${servicesOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`${servicesOpen ? "block" : "hidden"} pl-4`}>
                        <NavLink
                            to="/services/one"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `block px-2 py-2 text-sm ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                }`
                            }
                        >
                            Service 1
                        </NavLink>
                        <NavLink
                            to="/services/two"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `block px-2 py-2 text-sm ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                }`
                            }
                        >
                            Service 2
                        </NavLink>
                    </div>

                    {/* About accordion */}
                    <button
                        type="button"
                        onClick={() => setAboutOpen((o) => !o)}
                        className="flex w-full items-center justify-between px-2 py-2 text-base text-gray-700 hover:text-secondary"
                        aria-expanded={aboutOpen}
                    >
                        <span>About</span>
                        <ChevronDown className={`h-5 w-5 transition ${aboutOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className={`${aboutOpen ? "block" : "hidden"} pl-4`}>
                        <NavLink
                            to="/about/mission"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `block px-2 py-2 text-sm ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                }`
                            }
                        >
                            Our Mission
                        </NavLink>
                        <NavLink
                            to="/about/team"
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                                `block px-2 py-2 text-sm ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                }`
                            }
                        >
                            Our Team
                        </NavLink>
                    </div>

                    {/* Other links */}
                    <NavLink
                        to="/contact"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                            }`
                        }
                    >
                        Contact
                    </NavLink>
                    <NavLink
                        to="/event"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                            }`
                        }
                    >
                        Event
                    </NavLink>

                    <div className="my-3 h-px bg-gray-200" />

                    {/* Auth area (mobile) */}
                    {user ? (
                        <>
                            <NavLink
                                to="/settings/profile"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Profile
                            </NavLink>
                            <NavLink
                                to="/settings/security"
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Account Settings
                            </NavLink>
                            <button
                                onClick={async () => {
                                    try { await onLogout?.(); } finally { setMobileOpen(false); }
                                }}
                                className="block w-full text-left px-2 py-2 text-base text-red-600 hover:bg-red-50"
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
                                    `block px-2 py-2 text-base ${isActive ? "text-secondary font-medium" : "text-gray-700 hover:text-secondary"
                                    }`
                                }
                            >
                                Login
                            </NavLink>
                            <NavLink
                                to="/signup"
                                onClick={() => setMobileOpen(false)}
                                className="block px-2 py-2 text-base text-white bg-secondary rounded-md text-center mt-2"
                            >
                                Sign Up
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
