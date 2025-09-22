"use client";

import { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";

/**
 * mode: "service" | "status" | "range"
 * selectionMode: "multi" | "single"
 * displayLabel: optional text to force on the trigger (used for dynamic "Show" label)
 */
export default function FilterDropdown({
    mode = "service",
    selectionMode = "multi",
    displayLabel,                // << use for dynamic Show label
    buttonLabel,                 // fallback
    // multi-select props
    serviceOptions = [],
    statusOptions = [],
    selectedServices = [],
    selectedStatuses = [],
    onChange,                    // ({ services? , statuses? })
    onClear,
    // single-select props (for Show)
    options = [],                // [{ value, label }]
    value,
    onValueChange,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ---- handlers
    const toggleService = (opt) => {
        const services = selectedServices.includes(opt)
            ? selectedServices.filter((s) => s !== opt)
            : [...selectedServices, opt];
        onChange?.({ services });
    };

    const toggleStatus = (opt) => {
        const statuses = selectedStatuses.includes(opt)
            ? selectedStatuses.filter((s) => s !== opt)
            : [...selectedStatuses, opt];
        onChange?.({ statuses });
    };

    const pickSingle = (val) => {
        onValueChange?.(val);
        setOpen(false);
    };

    // ---- trigger text
    const count =
        mode === "service" ? selectedServices.length :
            mode === "status" ? selectedStatuses.length : 0;

    const defaultMultiLabel =
        mode === "service" ? "Select Services" : "Select Status";

    const computedLabel =
        displayLabel ??
        buttonLabel ??
        (selectionMode === "single"
            ? options.find((o) => o.value === value)?.label ?? "Select"
            : count ? `${defaultMultiLabel} (${count})` : defaultMultiLabel);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center justify-between rounded-md border text-nowrap border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
                <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    {computedLabel}
                </span>
                <svg
                    className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                >
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* UNMOUNT when closed => prevents click-through to table */}
            {open && (
                <div
                    className="absolute z-50 mt-1 w-72 right-0 rounded-md border border-gray-200 bg-white shadow-lg p-2 "
                    role="menu"
                >
                    <div className="max-h-64 overflow-y-auto text-sm">
                        {mode === "service" && selectionMode === "multi" && (
                            serviceOptions.length ? (
                                serviceOptions.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 px-4 py-2 cursor-pointer  hover:bg-gray-50 ">
                                        <input
                                            type="checkbox"
                                            checked={selectedServices.includes(opt)}
                                            onChange={() => toggleService(opt)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        {opt}
                                    </label>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-gray-500">No services</div>
                            )
                        )}

                        {mode === "status" && selectionMode === "multi" && (
                            statusOptions.length ? (
                                statusOptions.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(opt)}
                                            onChange={() => toggleStatus(opt)}
                                            className="h-4 w-4 text-blue-600  border-gray-300 rounded"
                                        />
                                        {opt}
                                    </label>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-gray-500">No status</div>
                            )
                        )}

                        {mode === "range" && selectionMode === "single" && (
                            options.length ? (
                                <ul>
                                    {options.map((o) => (
                                        <li key={o.value}>
                                            <button
                                                type="button"
                                                onClick={() => pickSingle(o.value)}
                                                className={`w-full text-left px-4 py-2 rounded  hover:bg-gray-50 ${value === o.value ? "font-medium" : ""}`}
                                            >
                                                {o.label} 
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-2 text-gray-500">No options</div>
                            )
                        )}
                    </div>

                    {(mode === "service" || mode === "status") && selectionMode === "multi" && (
                        <div className="flex justify-between border-t border-gray-200 px-3 py-2">
                            <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => onClear?.()}>
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
