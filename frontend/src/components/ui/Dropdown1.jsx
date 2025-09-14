"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    className = "",
    width = "w-40",
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // close dropdown if clicked outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className={`relative ${width} ${className}`} ref={ref}>
            {/* Button */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
                {value || placeholder}
                <ChevronDown className="ml-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown menu */}
            {open && (
                <div
                    className="absolute right-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg  dark:border-gray-700 dark:bg-gray-800"
                >
                    {options.map((opt, i) => (
                        <div key={opt}>
                            <button
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                }}
                                className={`block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${value === opt ? "font-semibold" : ""
                                    }`}
                            >
                                {opt}
                            </button>

                          
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
