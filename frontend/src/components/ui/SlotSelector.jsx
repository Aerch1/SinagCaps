"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { to12h } from "@/utils/availabilityUtils";
import useAvailability from "@/hooks/useAvailability"; // ✅ slot fetch hook

export default function SlotSelector({
    value, // "HH:mm"
    onChange,
    serviceId,
    date, // "YYYY-MM-DD"
    label = "Select Time",
    disabled = false,
    error,
}) {
    const [open, setOpen] = useState(false);
    const { slots = [], loading } = useAvailability(serviceId, date); // ✅ fetch slots for date

    const timeLabel = value ? to12h(value) : "Pick a time";

    const onQuickPick = (t) => {
        onChange?.(t);
        setOpen(false);
    };

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium mb-1">{label}</label>}

            <Popover open={open && !disabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled || loading}
                        className={[
                            "w-full justify-start text-left font-normal bg-white",
                            disabled ? "opacity-60 cursor-not-allowed" : "",
                            error ? "border-red-500" : "",
                        ].join(" ")}
                    >
                        {loading ? "Loading…" : timeLabel}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="z-[9999] w-[320px] p-3 bg-white border border-gray-200 shadow-md rounded-md"
                >
                    {/* State handling */}
                    {!date ? (
                        <div className="text-center text-sm text-gray-500 py-6">
                            Please select a date to view available times
                        </div>
                    ) : slots.length > 0 ? (
                        <div className="mb-3">
                            <span className="block text-xs font-medium text-gray-600 mb-2">
                                Available times
                            </span>
                            <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                {slots.map((s) => (
                                    <button
                                        key={s.time}
                                        type="button"
                                        onClick={() => !s.unavailable && onQuickPick(s.time)}
                                        disabled={s.unavailable}
                                        className={[
                                            "px-3 py-1.5 rounded-md border text-sm transition",
                                            s.unavailable
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                : value === s.time
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-slate-700 border-gray-300 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        {to12h(s.time)}{" "}
                                        {!s.unavailable && typeof s.remaining === "number"
                                            ? `(${s.remaining})`
                                            : ""}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-red-500 py-4">
                            🚫 No available times
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
