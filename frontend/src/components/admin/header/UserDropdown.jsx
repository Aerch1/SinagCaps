// src/components/header/UserDropdown.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../../store/authStore.js";



const UserDropdown = ({ user: propUser }) => {



    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);
    const { user: authedUser, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const currentUser =
        propUser ||
        authedUser || {
            name: "Admin User",
            email: "admin@example.com",
            avatar: null,
            role: "Administrator",
        };

    // Close on outside click & Esc
    useEffect(() => {
        const onDocClick = (e) => {
            if (isOpen && rootRef.current && !rootRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [isOpen]);

    // Close when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        setIsOpen(false);
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    const menuItems = [
        { icon: User, label: "Profile", path: "/admin/profile", description: "Manage your account" },
        { icon: Mail, label: "Messages", path: "/admin/messages", description: "View your messages" },
        { icon: Settings, label: "Settings", path: "/admin/settings", description: "Account preferences" },
        { icon: HelpCircle, label: "Help & Support", path: "/admin/help", description: "Get help and support" },
    ];

    return (
        <div className="relative" ref={rootRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                {currentUser.avatar ? (
                    <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <User size={16} />
                    </div>
                )}

                <div className="hidden lg:flex lg:flex-col lg:items-start">
                    <span className="text-gray-700  font-medium">
                        {currentUser.name}
                    </span>
                    <span className="text-xs text-gray-500 ">
                        {currentUser.role || "Administrator"}
                    </span>
                </div>

                <ChevronDown
                    size={16}
                    className={`hidden lg:inline text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-200  z-50"
                >
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200  bg-gray-50 ">
                        {currentUser.avatar ? (
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                                <User size={20} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {currentUser.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {currentUser.email}
                            </p>
                            <p className="text-xs text-red-600  font-medium">
                                {currentUser.role || "Administrator"}
                            </p>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                role="menuitem"
                                className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700  rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                    <item.icon
                                        size={16}
                                        className="text-gray-600  group-hover:text-red-600 dark:group-hover:text-red-400"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-xs text-gray-500 ">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-gray-200 ">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-3 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 group"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg   flex items-center justify-center   transition-colors">
                                <LogOut size={16} className="text-red-600 " />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">Sign Out</p>
                                <p className="text-xs text-red-500 ">
                                    Sign out of your account
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>)
}

export default UserDropdown