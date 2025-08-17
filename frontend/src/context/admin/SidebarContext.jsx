import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children, defaultExpanded = true }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 767px)");
        const apply = () => setIsMobile(mql.matches);
        apply();
        mql.addEventListener?.("change", apply);
        return () => mql.removeEventListener?.("change", apply);
    }, []);

    useEffect(() => {
        if (!isMobile) return;
        document.body.style.overflow = isMobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobile, isMobileOpen]);

    const toggleSidebar = useCallback(() => setIsExpanded((v) => !v), []);
    const toggleMobileSidebar = useCallback(() => setIsMobileOpen((v) => !v), []);
    const openMobileSidebar = useCallback(() => setIsMobileOpen(true), []);
    const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
    const toggleSubmenu = useCallback((item) => {
        setOpenSubmenu((prev) => (prev === item ? null : item));
    }, []);

    const value = useMemo(
        () => ({
            isExpanded: isMobile ? false : isExpanded,
            isMobileOpen,
            isMobile,
            isHovered,
            activeItem,
            openSubmenu,
            toggleSidebar,
            toggleMobileSidebar,
            openMobileSidebar,
            closeMobileSidebar,
            setIsHovered,
            setActiveItem,
            toggleSubmenu,
        }),
        [
            isExpanded, isMobileOpen, isMobile, isHovered, activeItem, openSubmenu,
            toggleSidebar, toggleMobileSidebar, openMobileSidebar, closeMobileSidebar, toggleSubmenu
        ]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider> (admin routes only).");
    return ctx;
}
