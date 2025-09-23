"use client";

import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
    error,
    buttonClassName = "",
    disabled = false,
}) {
    const selected = stringToDate(value);

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
                    <Calendar
                        mode="single"
                        selected={selected}
                        onSelect={(d) => onChange(dateToISO(d))}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
