import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({
    children,
    storageKey = "theme",
    defaultTheme = "light",
}) {
    const [isMounted, setIsMounted] = useState(false);

    // Lazy init with better localStorage handling
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored === "dark" || stored === "light") {
                    return stored;
                }
            } catch (error) {
                console.warn("Failed to read theme from localStorage:", error);
            }
        }
        return defaultTheme;
    });

    // Set mounted state and apply theme after hydration
    useEffect(() => {
        setIsMounted(true);

        const root = document.documentElement;

        // Remove both classes first
        root.classList.remove("dark", "light", "theme-loading");

        // Add the appropriate class
        if (theme === "dark") {
            root.classList.add("dark");
        }

        // Persist to localStorage
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            console.warn("Failed to save theme to localStorage:", error);
        }
    }, []);

    // Apply theme changes after initial mount
    useEffect(() => {
        if (!isMounted) return;

        const root = document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.remove("dark");
            root.classList.add("light");
        }

        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            console.warn("Failed to save theme to localStorage:", error);
        }
    }, [theme, storageKey, isMounted]);

    // Add a class to suppress dark styles before hydration
    useEffect(() => {
        if (!isMounted) {
            document.documentElement.classList.add("theme-loading");
        } else {
            document.documentElement.classList.remove("theme-loading");
        }
    }, [isMounted]);

    // Sync with localStorage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === storageKey && (e.newValue === "dark" || e.newValue === "light")) {
                setTheme(e.newValue);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [storageKey]);

    const toggleTheme = () => {
        setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
    };

    const isDark = theme === "dark";

    const value = useMemo(
        () => ({
            theme,
            isDark,
            isMounted,
            setTheme,
            toggleTheme
        }),
        [theme, isDark, isMounted]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within <ThemeProvider>");
    }
    return ctx;
}