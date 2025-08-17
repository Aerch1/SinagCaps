import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null); // value: { theme, isDark, setTheme, toggleTheme }

export function ThemeProvider({ children, storageKey = "adminTheme", defaultTheme = "light" }) {
    const [theme, setTheme] = useState(defaultTheme);
    const [ready, setReady] = useState(false);

    // Load once on mount (client-only)
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setTheme(saved);
        setReady(true);
    }, [storageKey]);

    // Persist only (NO documentElement mutation)
    useEffect(() => {
        if (!ready) return;
        localStorage.setItem(storageKey, theme);
    }, [ready, theme, storageKey]);

    const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
    const isDark = theme === "dark";

    const value = useMemo(() => ({ theme, isDark, setTheme, toggleTheme }), [theme, isDark]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within <ThemeProvider> (admin routes only).");
    return ctx;
}
