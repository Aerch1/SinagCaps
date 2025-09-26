"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { generateTimeOptions, to12h } from "@/utils/availabilityUtils";

const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function TimeSelector({
    value, // stored as "HH:mm"
    onChange,
    churchHours = {},
    weekday,
    step = 30,
    label = "Select Time",
    disabled = false,
    error,
}) {
    const [open, setOpen] = useState(false);

    // build available times
    const suggestions = useMemo(() => {
        if (weekday == null) return [];
        const hours = churchHours?.[weekday];
        if (!hours || hours.is_closed) return [];
        return generateTimeOptions(churchHours, weekday, step); // ["08:00", "08:30", ...]
    }, [churchHours, weekday, step]);

    const timeLabel = value ? to12h(value) : "Pick a time";

    const onQuickPick = (t) => {
        onChange?.(t); // already "HH:mm"
        setOpen(false);
    };

    const onCustomChange = (e) => {
        const raw = e.target.value || "";
        if (!raw || TIME_24H.test(raw)) {
            onChange?.(raw); // still "HH:mm"
        }
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}

            <Popover open={open && !disabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={[
                            "w-full justify-start text-left font-normal bg-white",
                            disabled ? "opacity-60 cursor-not-allowed" : "",
                            error ? "border-red-500" : "",
                        ].join(" ")}
                    >
                        {timeLabel}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="z-[9999] w-[320px] p-3 bg-white border border-gray-200 shadow-md rounded-md"
                >
                    {suggestions?.length > 0 ? (
                        <div className="mb-3">
                            <span className="block text-xs font-medium text-gray-600 mb-2">
                                Available times
                            </span>

                            {/* 🔹 Scrollable list with max height */}
                            <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                {suggestions.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => onQuickPick(t)}
                                        className={[
                                            "px-3 py-1.5 rounded-md border text-sm transition",
                                            t === value
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-slate-700 border-gray-300 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        {to12h(t)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-red-500 py-4">
                            🚫 Closed or no times available
                        </div>
                    )}

                    {/* Custom input */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Or enter custom time
                        </label>
                        <input
                            type="time"
                            value={value || ""}
                            step={step * 60}
                            onChange={onCustomChange}
                            className={[
                                "w-full px-3 py-2 border rounded-lg",
                                "bg-white text-gray-900",
                                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                error ? "border-red-500" : "border-gray-300",
                            ].join(" ")}
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
