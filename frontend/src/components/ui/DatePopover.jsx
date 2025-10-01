// src/components/common/modal/DatePopover.jsx
"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import useMonthAvailability from "@/hooks/useMonthAvailability.js";
import useChurchHours from "@/hooks/useChurchHours.js"; // ✅ NEW
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { parseDate, formatDate } from "@/utils/availabilityUtils.js";

export default function DatePopover({
    label = "Appointment Date",
    value,
    onChange,
    serviceId,
    error,
    buttonClassName = "",
    disabled = false,
}) {
    const selected = value ? parseDate(value) : undefined;

    const [viewMonth, setViewMonth] = useState(selected || new Date());
    const viewYear = viewMonth.getFullYear();
    const viewMonthNum = viewMonth.getMonth() + 1;

    const { days, loading } = useMonthAvailability(serviceId, viewYear, viewMonthNum);
    const { churchHours } = useChurchHours(); // ✅ fetch church hours

    // ✅ Merge rules with church hours
    const mergedDays = useMemo(() => {
        const copy = { ...days };
        Object.keys(copy).forEach((iso) => {
            const d = parseDate(iso);
            if (!d) return;
            const weekday = d.getDay(); // 0=Sun
            const ch = churchHours[weekday];

            if (ch && ch.is_closed) {
                copy[iso] = { status: "closed", remaining: 0, capacity: 0, booked: 0 };
            }
        });
        return copy;
    }, [days, churchHours]);

    const availableDates = useMemo(
        () => Object.entries(mergedDays).filter(([, info]) => info.status === "available").map(([date]) => parseDate(date)),
        [mergedDays]
    );
    const blockedDates = useMemo(
        () => Object.entries(mergedDays).filter(([, info]) => info.status === "blocked").map(([date]) => parseDate(date)),
        [mergedDays]
    );
    const closedDates = useMemo(
        () => Object.entries(mergedDays).filter(([, info]) => info.status === "closed").map(([date]) => parseDate(date)),
        [mergedDays]
    );
    const noScheduleDates = useMemo(
        () => Object.entries(mergedDays).filter(([, info]) => info.status === "none").map(([date]) => parseDate(date)),
        [mergedDays]
    );

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>}

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
                        {selected ? formatDate(selected) : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="z-[1000] p-0 bg-white border border-gray-200 shadow-md rounded-md"
                >
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-blue-100">
                                <div className="h-1 w-1/2 animate-pulse bg-blue-500" />
                            </div>
                        )}

                        <TooltipProvider>
                            <Calendar
                                mode="single"
                                selected={selected}
                                month={viewMonth}
                                onMonthChange={setViewMonth}
                                onSelect={(d) => {
                                    if (!d) return;
                                    const iso = formatDate(d);
                                    const info = mergedDays[iso];
                                    if (info?.status === "closed" || info?.status === "blocked") {
                                        return;
                                    }
                                    onChange(formatDate(d));
                                }}
                                initialFocus
                                modifiers={{
                                    available: availableDates,
                                    blocked: blockedDates,
                                    closed: closedDates,
                                    none: noScheduleDates,
                                }}
                                modifiersClassNames={{
                                    available: "bg-green-100 text-green-900 hover:bg-green-200 aria-selected:bg-green-200",
                                    blocked: "bg-red-100 text-red-900 hover:bg-red-200 aria-selected:bg-red-200",
                                    closed: "bg-gray-200 text-gray-500 hover:bg-gray-300 aria-selected:bg-gray-300 cursor-not-allowed",
                                    none: "",
                                }}
                                classNames={{
                                    // ✅ keep default colors, only remove ugly yellow focus
                                    day: "focus:outline-none focus:ring-0",
                                    day_selected: "bg-blue-600 text-white rounded-md hover:bg-blue-600",
                                }}
                                components={{
                                    DayContent: ({ date }) => {
                                        const iso = formatDate(date);
                                        const info = mergedDays[iso];
                                        let tooltip = "No schedule — you can still book";

                                        if (info?.status === "available") {
                                            tooltip = `${info.remaining} of ${info.capacity} slots left`;
                                        } else if (info?.status === "blocked") {
                                            tooltip =
                                                info.capacity > 0
                                                    ? `Fully booked (${info.booked}/${info.capacity})`
                                                    : "Blocked";
                                        } else if (info?.status === "closed") {
                                            tooltip = "Church Closed";
                                        } else if (info?.status === "none") {
                                            tooltip = "No schedule defined";
                                        }

                                        return (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>{date.getDate()}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>{tooltip}</TooltipContent>
                                            </Tooltip>
                                        );
                                    },
                                }}
                            />

                        </TooltipProvider>
                    </div>
                </PopoverContent>
            </Popover>

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
