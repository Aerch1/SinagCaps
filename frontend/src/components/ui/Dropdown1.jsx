"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function Dropdown({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    className = "",
    width = "w-40",
    formatter,
}) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const ref = useRef(null);

    // close dropdown if clicked outside
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    // calculate position for portal dropdown
    useEffect(() => {
        if (open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [open]);

    // normalize options
    const normalized = options.map((opt) =>
        typeof opt === "string"
            ? { value: opt, label: formatter ? formatter(opt) : opt }
            : {
                value: opt.value,
                label: opt.label || (formatter ? formatter(opt.value) : opt.value),
            }
    );

    const selected = normalized.find((o) => o.value === value);

    return (
        <div className={`relative ${width} ${className}`} ref={ref}>
            {/* Button */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
                {selected ? selected.label : placeholder}
                <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown menu in portal */}
            {open &&
                position &&
                createPortal(
                    <div
                        style={{
                            position: "absolute",
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            zIndex: 9999,
                        }}
                        className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
                    >
                        {normalized.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 ${value === opt.value ? "font-medium" : ""
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}
