import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../../context/admin/SidebarContext";
import ThemeToggleButton from "../../components/admin/ThemeToggleButton";

// If you have these, keep them; otherwise stub or remove:
// import NotificationDropdown from "../../components/header/NotificationDropdown";
// import UserDropdown from "../../components/header/UserDropdown";

export default function AppHeader() {
    const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
    const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

    const handleToggle = () => {
        if (window.innerWidth >= 1024) toggleSidebar();
        else toggleMobileSidebar();
    };

    const toggleApplicationMenu = () => setApplicationMenuOpen((v) => !v);

    const inputRef = useRef(null);

    // ⌘K / Ctrl+K focus
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:border-b">
            <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
                <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
                    {/* Sidebar toggle */}
                    <button
                        className="z-50 hidden h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:flex"
                        onClick={handleToggle}
                        aria-label="Toggle Sidebar"
                    >
                        {isMobileOpen ? (
                            // X icon
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        ) : (
                            // Hamburger
                            <svg width="18" height="14" viewBox="0 0 16 12" fill="none">
                                <path
                                    d="M1 1h14M1 6h10M1 11h14"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                    </button>

                    {/* Brand (mobile only) */}
                    <Link to="/" className="lg:hidden">
                        <img className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" />
                        <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" />
                    </Link>

                    {/* App menu (mobile) */}
                    <button
                        onClick={toggleApplicationMenu}
                        className="z-50 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                        aria-label="Open header menu"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 12a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0zM12 12a2 2 0 100-4 2 2 0 000 4z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>

                    {/* Search (desktop) */}
                    <div className="hidden lg:block">
                        <form>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                    <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20">
                                        <path d="M9.375 1.542A7.833 7.833 0 111.542 9.375 7.833 7.833 0 019.375 1.542zm0 14.163a6.33 6.33 0 100-12.66 6.33 6.33 0 000 12.66zm6.043.713l3.06 3.06-1.06 1.06-3.06-3.06 1.06-1.06z" />
                                    </svg>
                                </span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search or type command..."
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
                                    ⌘ K
                                </span>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right-side actions */}
                <div
                    className={`${isApplicationMenuOpen ? "flex" : "hidden"
                        } w-full items-center justify-between gap-4 px-5 py-4 shadow-sm lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
                >
                    <div className="flex items-center gap-2">
                        <ThemeToggleButton />
                        {/* <NotificationDropdown /> */}
                    </div>
                    {/* <UserDropdown /> */}
                </div>
            </div>
        </header>
    );
}
