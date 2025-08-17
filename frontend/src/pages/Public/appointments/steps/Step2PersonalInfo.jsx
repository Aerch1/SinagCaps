// src/pages/Public/appointments/steps/Step2DateTime.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    toISO,
    fromISO,
    daysInMonth,
    firstDayOfWeek,
    lastDayOfWeek,
    monthKey,
    slotsLeftForTime,
    buildMonthPayload,
} from "../../../../utils/index.js";
import { isToday } from "date-fns";

export default function Step2DateTime({ formData, setFormData }) {
    const now = new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [monthMaps, setMonthMaps] = useState({});
    const [availableTimes, setAvailableTimes] = useState([]);

    const service = formData.serviceType || "";

    const monthLabel = useMemo(
        () => new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" }),
        [year, month]
    );

    const changeMonth = (delta) => {
        const n = new Date(year, month + delta, 1);
        setYear(n.getFullYear());
        setMonth(n.getMonth());
        setFormData((prev) => ({ ...prev, preferredTime: "" }));
        setAvailableTimes([]);
    };

    async function loadMonth(serviceKey, y, m) {
        if (!serviceKey) return;
        const key = monthKey(y, m);
        const svcMaps = monthMaps[serviceKey] || {};
        if (svcMaps[key]) return;

        const payload = buildMonthPayload(serviceKey, y, m);

        const map = {};
        (payload.days || []).forEach((d) => {
            map[d.date] = { status: d.status, times: d.times || [] };
        });

        setMonthMaps((prev) => ({
            ...prev,
            [serviceKey]: {
                ...(prev[serviceKey] || {}),
                [key]: map,
            },

        }));
    }


    // Always 6 weeks (42 cells) to avoid height jump
    const calendarCells = useMemo(() => {
        const cells = [];
        const startDow = firstDayOfWeek(year, month);
        const endDow = lastDayOfWeek(year, month);
        const dim = daysInMonth(year, month);
        const dimPrev = daysInMonth(year, month - 1);

        for (let i = startDow - 1; i >= 0; i--) {
            const day = dimPrev - i;
            cells.push({ date: new Date(year, month - 1, day), inMonth: false });
        }
        for (let d = 1; d <= dim; d++) {
            cells.push({ date: new Date(year, month, d), inMonth: true });
        }
        const trailing = 6 - endDow;
        for (let i = 1; i <= trailing; i++) {
            cells.push({ date: new Date(year, month + 1, i), inMonth: false });
        }
        while (cells.length < 42) {
            const last = cells[cells.length - 1].date;
            const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
            cells.push({ date: next, inMonth: false });
        }
        return cells;
    }, [year, month]);

    useEffect(() => {
        if (!service) return;
        const cur = new Date(year, month, 1);
        const prev = new Date(year, month - 1, 1);
        const next = new Date(year, month + 1, 1);

        (async () => {
            await loadMonth(service, cur.getFullYear(), cur.getMonth());
            await loadMonth(service, prev.getFullYear(), prev.getMonth());
            await loadMonth(service, next.getFullYear(), next.getMonth());
        })();
    }, [service, year, month]);

    useEffect(() => {
        setFormData((p) => ({ ...p, preferredDate: "", preferredTime: "" }));
        setAvailableTimes([]);
    }, [service]);

    useEffect(() => {
        if (!formData.preferredDate || !service) {
            setAvailableTimes([]);

            return;
        }
        const d = fromISO(formData.preferredDate);
        const mk = monthKey(d.getFullYear(), d.getMonth());
        const entry = monthMaps[service]?.[mk]?.[formData.preferredDate];

        const times = (entry?.times || []).filter(
            (t) => slotsLeftForTime(service, formData.preferredDate, t) > 0
        );
        setAvailableTimes(entry?.status === "available" ? times : []);
    }, [formData.preferredDate, service, monthMaps]);

    // ✅ Missing day => "neutral" (gray), not "unavailable"
    function getStatusFor(dateObj) {
        if (!service) return "neutral";
        const mk = monthKey(dateObj.getFullYear(), dateObj.getMonth());
        const iso = toISO(dateObj);
        const entry = monthMaps[service]?.[mk]?.[iso];
        return entry ? entry.status : "neutral"; // <-- was "unavailable"
    }

    const handleDayClick = (dateObj) => {
        
        const status = getStatusFor(dateObj);
        if (status !== "available") return;
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();
        if (m !== month || y !== year) {
            setYear(y);
            setMonth(m);
        }
        const iso = toISO(dateObj);
        setFormData((prev) => ({ ...prev, preferredDate: iso, preferredTime: "" }));
    };

    const selectedISO = formData.preferredDate;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Calendar */}
                <div className="md:col-span-7 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="text-sm text-gray-600 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            aria-label="Previous month"
                        >
                            &larr;
                        </button>
                        <span className="text-gray-900 font-medium">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="text-sm text-gray-600 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            aria-label="Next month"
                        >
                            &rarr;
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-gray-500">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
                            <div key={w} className="text-center">{w}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map(({ date, inMonth }, idx) => {
                            const iso = toISO(date);
                            const status = getStatusFor(date); // "available" | "unavailable" | "blocked" | "neutral"
                            const isSelected = selectedISO === iso;
                            const isDisabled = status !== "available";

                            let textClass = "";
                            let bgClass = "";

                            if (!inMonth) {
                                textClass = "text-gray-300"; // overflow
                            } else if (status === "available") {
                                textClass = "text-green-700 font-medium";
                                bgClass = "bg-green-50";
                            } else if (status === "unavailable" || status === "blocked") {
                                textClass = "text-red-600 font-medium";
                                bgClass = "bg-red-50";
                            } else {
                                // neutral day in current month
                                textClass = "text-gray-400";


                            }


                          

                            return (
                                <button
                                    type="button"
                                    key={iso + idx}
                                    onClick={isDisabled ? undefined : () => handleDayClick(date)}
                                    className={[
                                        "h-9 w-full rounded-md text-xs grid place-items-center select-none transition",
                                        isDisabled ? "" : "cursor-pointer",
                                        "border border-transparent hover:bg-gray-100/30",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                                        textClass,
                                        bgClass,
                                        isSelected ? "ring-2 ring-gray-200 font-semibold" : "",
                                    ].join(" ")}
                                    title={iso}
                                    aria-disabled={isDisabled}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-green-50 border border-green-500" />
                            <span className="text-green-700">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-50 border border-red-500" />
                            <span className="text-red-600">Not Available</span>
                        </div>
                       
                    </div>
                </div>

                {/* Times */}
                <div className="md:col-span-5">
                    <h4 className="mb-2 font-medium text-gray-900">Available Times</h4>

                    {!service ? (
                        <p className="text-sm text-gray-500">Go back and select a service first.</p>
                    ) : !formData.preferredDate ? (
                        <p className="text-sm text-gray-500">Select a date.</p>
                    ) : availableTimes.length === 0 ? (
                        <p className="text-sm text-gray-500">No times available for this date.</p>
                    ) : (
                        <div className="space-y-2">
                            {availableTimes
                                .map((t) => ({ time: t, left: slotsLeftForTime(service, formData.preferredDate, t) }))
                                .filter(({ left }) => left > 0)
                                .map(({ time, left }) => (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, preferredTime: time }))}
                                        className={[
                                            "w-full px-3 py-2 rounded border text-sm flex items-center justify-between transition",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                                            formData.preferredTime === time
                                                ? "bg-secondary text-white border-secondary"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100/30",
                                        ].join(" ")}
                                    >
                                        <span>{time}</span>
                                        <span className="text-xs font-medium">{left} slots left</span>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
