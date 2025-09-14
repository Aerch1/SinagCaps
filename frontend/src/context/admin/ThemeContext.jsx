import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
// value: { theme, isDark, setTheme, toggleTheme }

export function ThemeProvider({
    children,
    storageKey = "theme", // unify key with index.html script
    defaultTheme = "light"
}) {
    const [theme, setTheme] = useState(defaultTheme);

    // Load theme once on mount
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setTheme(saved);
        }
    }, [storageKey]);

    // Apply theme to <html> and persist in localStorage
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem(storageKey, theme);
    }, [theme, storageKey]);

    const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
    const isDark = theme === "dark";

    const value = useMemo(
        () => ({ theme, isDark, setTheme, toggleTheme }),
        [theme, isDark]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>.");
    return ctx;
}
