// src/components/ui/ThemeToggleButton.jsx
import { useTheme } from "../../context/admin/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleButton({ onToggled, className = "" }) {
    const { isDark, toggleTheme } = useTheme();

    const handleClick = () => {
        toggleTheme();
        if (typeof onToggled === "function") onToggled();
    };

    return (
        <button
            onClick={handleClick}
            aria-pressed={isDark}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white ${className}`}
            aria-label="Toggle theme"
            type="button"
        >
            {/* Dark icon (shown when dark) */}
            <Moon className="hidden dark:block" size={18} />
            {/* Light icon (shown when light) */}
            <Sun className="dark:hidden" size={18} />
        </button>
    );
}
