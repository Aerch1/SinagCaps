"use client";

import { useMemo, useState } from "react";
import { format, parse, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import useMonthAvailability from "@/hooks/useMonthAvailability.js";

const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

function stringToDate(iso) {
    if (!iso || !YYYYMMDD.test(iso)) return undefined;
    const d = parse(iso, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
}

function dateToISO(d) {
    return d ? format(d, "yyyy-MM-dd") : "";
}

export default function DatePopover({
    label = "Appointment Date",
    value,
    onChange,
    serviceId, // ✅ must be provided
    error,
    buttonClassName = "",
    disabled = false,
}) {
    const selected = stringToDate(value);

    // control which month is being viewed
    const [viewMonth, setViewMonth] = useState(selected || new Date());
    const viewYear = viewMonth.getFullYear();
    const viewMonthNum = viewMonth.getMonth() + 1; // 1..12

    // fetch month availability from backend
    const { available, blocked, loading } = useMonthAvailability(
        serviceId,
        viewYear,
        viewMonthNum
    );

    // Precompute Date objects for modifiers
    const availableDates = useMemo(() => available.map(parseISO), [available]);
    const blockedDates = useMemo(() => blocked.map(parseISO), [blocked]);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    {label}
                </label>
            )}

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={[
                            "w-full justify-start text-left font-normal bg-white text-gray-900",
                            disabled ? "opacity-60 cursor-not-allowed" : "",
                            error ? "border-red-500" : "",
                            buttonClassName,
                        ].join(" ")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selected ? format(selected, "yyyy-MM-dd") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="z-[1000] p-0 bg-white border border-gray-200 shadow-md rounded-md"
                >
                    <div className="relative">
                        {/* optional tiny loader bar */}
                        {loading && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-blue-100">
                                <div className="h-1 w-1/2 animate-pulse bg-blue-500" />
                            </div>
                        )}

                        <Calendar
                            mode="single"
                            selected={selected}
                            month={viewMonth}
                            onMonthChange={setViewMonth} // re-fetch when month changes
                            onSelect={(d) => onChange(dateToISO(d))}
                            initialFocus
                            modifiers={{
                                available: availableDates,
                                blocked: blockedDates,
                                disabled: blockedDates, // prevent clicking blocked
                            }}
                            modifiersClassNames={{
                                available:
                                    "bg-green-100 text-green-900 hover:bg-green-200 hover:text-green-900 aria-selected:bg-green-200",
                                blocked:
                                    "bg-red-100 text-red-900 hover:bg-red-200 hover:text-red-900 aria-selected:bg-red-200 line-through",
                                disabled: "opacity-60 cursor-not-allowed",
                            }}
                            classNames={{
                                day_selected:
                                    "bg-blue-600 text-white rounded-md hover:bg-blue-600",
                            }}
                        />
                    </div>
                </PopoverContent>
            </Popover>

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
