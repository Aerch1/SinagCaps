import { useTheme } from "../../context/admin/ThemeContext";

export default function ThemeToggleButton() {
    const { toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Toggle theme"
        >
            {/* Moon (visible in dark) */}
            <svg
                className="hidden dark:block"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327Z"
                    fill="currentColor"
                />
            </svg>

            {/* Sun (visible in light) */}
            <svg
                className="dark:hidden"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M10 6.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM10 1.5v2M10 16.5v2M3.5 10h-2M18.5 10h-2M4.64 4.64l-1.41-1.41M16.77 16.77l-1.41-1.41M4.64 15.36l-1.41 1.41M16.77 3.23l-1.41 1.41"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        </button>
    );
}
