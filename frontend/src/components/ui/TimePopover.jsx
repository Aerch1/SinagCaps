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
    step = 60,                // seconds for <input type="time">
}) {
    const [open, setOpen] = useState(false);

    const timeLabel = value ? to12(value) : "Pick a time";

    const onQuickPick = (t) => {
        onChange?.(t);
        setOpen(false);
    };

    const onCustomChange = (e) => {
        const raw = e.target.value || "";
        if (!raw || TIME_24H.test(raw)) {
            onChange?.(raw);
        }
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            "w-full justify-start text-left font-normal bg-white",
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
                    className="z-[9999] w-[340px] p-3 bg-white border border-gray-200 shadow-md rounded-md"
                >
                    {/* Available times */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Available times</span>
                            {loading && <span className="text-xs text-gray-500">Loading…</span>}
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
                                                : "bg-white text-slate-700 border-gray-300 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        {to12(t)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No availability for the selected date.</p>
                        )}
                    </div>

                    {/* Custom time */}
                    <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
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
                                    "bg-white text-gray-900",
                                    "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                    error ? "border-red-500" : "border-gray-300",
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
