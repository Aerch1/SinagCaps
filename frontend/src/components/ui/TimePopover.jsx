"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { parse, format, isValid } from "date-fns";

const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function TimePopover({
    label = "Preferred Time",
    value,                    // "HH:mm" | ""
    onChange,                 // (v: "HH:mm") => void
    suggestions = [],         // array of "HH:mm"
    loading = false,
    disabled = false,
    error,
    buttonClassName = "",
    step = 60,                // seconds for <input type="time"> granularity (60 = 1 min, 300 = 5 min)
}) {
    const [open, setOpen] = useState(false);

    // Button label: show 12h if we have a value
    const timeLabel = value ? to12(value) : "Pick a time";

    const onQuickPick = (t) => {
        // t is "HH:mm" (internal)
        onChange?.(t);
        setOpen(false);
    };

    const onCustomChange = (e) => {
        // e.target.value is "HH:mm" (always 24h)
        const raw = e.target.value || "";
        if (!raw || TIME_24H.test(raw)) {
            onChange?.(raw);
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium  text-gray-900 dark:text-gray-100 mb-2">
                    {label}
                </label>
            )}

            <Popover open={open && !disabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={[
                            "w-full justify-start dark:bg-slate-700  text-left font-normal",
                            disabled ? "opacity-60 cursor-not-allowed" : "",
                            error ? "border-red-500" : "",
                            buttonClassName,
                        ].join(" ")}
                    >
                        {timeLabel}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="z-[9999] w-[340px] p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md rounded-md"
                >
                    {/* Available times (from backend availability; displayed 12h, keep 24h internally) */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Available times</span>
                            {loading && <span className="text-xs text-gray-500 dark:text-slate-400">Loading…</span>}
                        </div>

                        {suggestions?.length ? (
                            <div className="grid grid-cols-3 gap-2">
                                {suggestions.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => onQuickPick(t)}
                                        className={[
                                            "px-3 py-1.5 rounded-md border text-sm transition",
                                            t === (value || "")
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600",
                                        ].join(" ")}
                                    >
                                        {to12(t)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-slate-400">No availability for the selected date.</p>
                        )}
                    </div>

                    {/* Custom time (single input, AM/PM UI where the browser locale supports it) */}
                    <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Or enter custom time
                        </label>

                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={value || ""}
                                step={step}
                                onChange={onCustomChange}
                                className={[
                                    "flex-1 px-3 py-2 border rounded-lg",
                                    "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100",
                                    "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                    error ? "border-red-500" : "border-gray-300 dark:border-slate-600",
                                ].join(" ")}
                            />
                            <Button type="button" onClick={() => setOpen(false)} className="shrink-0">
                                Done
                            </Button>
                        </div>

                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

/* Helpers */
function to12(hhmm) {
    try {
        const d = parse(hhmm, "HH:mm", new Date());
        return isValid(d) ? format(d, "h:mm aa") : hhmm;
    } catch {
        return hhmm;
    }
}
