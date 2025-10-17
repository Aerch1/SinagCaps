"use client";

import { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";

export default function FilterDropdown({
    mode = "service",
    selectionMode = "multi",
    options = [],
    value,       // for single
    values = [], // for multi
    onChange,
    displayLabel,
    buttonLabel,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const toggleOption = (val) => {
        if (values.includes(val)) {
            onChange(values.filter((v) => v !== val));
        } else {
            onChange([...values, val]);
        }
    };

    const pickSingle = (val) => {
        onChange(val);
        setOpen(false);
    };

    /* ---------- Label logic ---------- */
    let computedLabel;
    if (displayLabel) {
        computedLabel = displayLabel;
    } else if (selectionMode === "single") {
        computedLabel =
            options.find((o) => o.value === value)?.label ??
            buttonLabel ??
            "Select";
    } else {
        computedLabel = values.length
            ? `${values.length} selected`
            : `Select ${mode === "service" ? "Services" : "Status"}`;
    }

    return (
        <div className="relative w-full sm:w-auto" ref={ref}>
            {/* Button - Responsive width */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full sm:min-w-[120px] sm:max-w-[240px]"
            >
                <span className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
                    <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{computedLabel}</span>
                </span>

                <svg
                    className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown menu - Responsive positioning and width */}
            {open && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-2 w-full sm:w-64 left-0 sm:left-auto max-w-[calc(100vw-2rem)]">
                    <div className="max-h-64 overflow-y-auto text-sm">
                        {/* Multi-select */}
                        {selectionMode === "multi" &&
                            (options.length ? (
                                options.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className="flex items-center gap-3 px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-50 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={values.includes(opt.value)}
                                            onChange={() => toggleOption(opt.value)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded flex-shrink-0"
                                        />
                                        <span className="break-words flex-1">{opt.label}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="px-3 sm:px-4 py-2 text-gray-500">No options</div>
                            ))}

                        {/* Single-select */}
                        {selectionMode === "single" &&
                            (options.length ? (
                                <ul>
                                    {options.map((opt) => (
                                        <li key={opt.value}>
                                            <button
                                                type="button"
                                                onClick={() => pickSingle(opt.value)}
                                                className={`w-full text-left px-3 sm:px-4 py-2 rounded hover:bg-gray-50 break-words ${value === opt.value ? "font-medium bg-gray-50" : ""
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-3 sm:px-4 py-2 text-gray-500">No options</div>
                            ))}
                    </div>

                    {/* Multi footer */}
                    {selectionMode === "multi" && (
                        <div className="flex justify-between items-center border-t border-gray-200 px-3 py-2 mt-1">
                            <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-800 hover:underline"
                                onClick={() => onChange([])}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline sm:hidden"
                                onClick={() => setOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}