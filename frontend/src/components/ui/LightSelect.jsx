"use client";

import React from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

/**
 * Light-only Select (shadcn/ui)
 * props:
 * - value: string | undefined
 * - onChange: (val: string) => void
 * - options: Array<string> | Array<{ value: string; label: string }>
 * - placeholder?: string
 * - onOpen?: () => void      // fires when it opens
 * - className?: string
 * - disabled?: boolean
 */
export default function LightSelect({
    value,
    onChange,
    options = [],
    placeholder = "Select…",
    onOpen,
    className = "",
    disabled = false,
}) {
    const norm = options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o
    );

    return (
        <Select
            value={value}
            onValueChange={onChange}
            onOpenChange={(open) => open && onOpen?.()}
            disabled={disabled}
        >
            <SelectTrigger
                className={[
                    "h-11 w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-800",
                    "px-3 pr-9 focus-visible:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    className,
                ].join(" ")}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent
                align="start"
                className="w-[var(--radix-select-trigger-width)] rounded-md border border-gray-200 bg-white shadow-sm"
            >
                {norm.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
