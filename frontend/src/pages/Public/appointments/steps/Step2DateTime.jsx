"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../api/api.js";
import toast from "react-hot-toast";
import { toISO } from "../../../../utils/index.js";

/* Convert "HH:mm" → "h:mm AM/PM" */
function format12h(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function Step2DateTime({ formData, setFormData }) {
    const now = new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [monthAvailability, setMonthAvailability] = useState({});
    const [availableTimes, setAvailableTimes] = useState([]);

    const serviceId = formData.service_id || "";

    const monthLabel = useMemo(
        () =>
            new Date(year, month, 1).toLocaleString("default", {
                month: "long",
                year: "numeric",
            }),
        [year, month]
    );

    const changeMonth = (delta) => {
        const n = new Date(year, month + delta, 1);
        setYear(n.getFullYear());
        setMonth(n.getMonth());
        setFormData((prev) => ({ ...prev, preferredDate: "", preferredTime: "" }));
        setAvailableTimes([]);
    };

    /* Load month availability */
    useEffect(() => {
        if (!serviceId) return;
        const loadMonth = async () => {
            try {
                const res = await api.get(
                    `/availability/${serviceId}/month/${year}/${month + 1}`
                );
                setMonthAvailability(res.data.days || {});
            } catch (err) {
                console.error("❌ Month availability error:", err);
                toast.error("Failed to load availability");
            }
        };
        loadMonth();
    }, [serviceId, year, month]);

    /* Reset when service changes */
    useEffect(() => {
        setFormData((p) => ({ ...p, preferredDate: "", preferredTime: "" }));
        setAvailableTimes([]);
    }, [serviceId]);

    /* Load daily slots */
    useEffect(() => {
        if (!formData.preferredDate || !serviceId) {
            setAvailableTimes([]);
            return;
        }

        const loadTimes = async () => {
            try {
                const res = await api.get(
                    `/availability/${serviceId}/${formData.preferredDate}`
                );
                setAvailableTimes(res.data.slots || []);
            } catch (err) {
                console.error("❌ Daily slots error:", err);
                toast.error("Failed to load times");
                setAvailableTimes([]);
            }
        };

        loadTimes();
    }, [formData.preferredDate, serviceId]);

    const selectedISO = formData.preferredDate;

    const getDayData = (dateObj) => {
        if (!serviceId) return { status: "neutral", remaining: 0 };
        const iso = toISO(dateObj);
        return monthAvailability[iso] || { status: "neutral", remaining: 0 };
    };

    const handleDayClick = (dateObj) => {
        const iso = toISO(dateObj);
        const dayData = getDayData(dateObj);

        // Only block closed/blocked days
        if (dayData.status === "blocked" || dayData.status === "none") return;

        setFormData((prev) => ({ ...prev, preferredDate: iso, preferredTime: "" }));
    };

    // Build 6-week calendar grid
    const calendarCells = useMemo(() => {
        const cells = [];
        const first = new Date(year, month, 1);
        const startDow = first.getDay();
        const dim = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startDow; i++) {
            const d = new Date(year, month, -i);
            cells.unshift({ date: d, inMonth: false });
        }
        for (let d = 1; d <= dim; d++) {
            cells.push({ date: new Date(year, month, d), inMonth: true });
        }
        while (cells.length < 42) {
            const last = cells[cells.length - 1].date;
            const next = new Date(last);
            next.setDate(last.getDate() + 1);
            cells.push({ date: next, inMonth: false });
        }
        return cells;
    }, [year, month]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Calendar */}
                <div className="md:col-span-7 border border-gray-200 rounded-md p-4">
                    <h4 className="mb-2 font-medium text-gray-900">Select a Date</h4>

                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            &larr;
                        </button>
                        <span className="text-gray-900 font-medium">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            &rarr;
                        </button>
                    </div>


                    <>
                        {/* Weekdays */}
                        <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-gray-500">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
                                <div key={w} className="text-center">{w}</div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarCells.map(({ date, inMonth }, idx) => {
                                const iso = toISO(date);
                                const dayData = getDayData(date);
                                const status = dayData.status || "none";
                                const remaining = dayData.remaining ?? 0;
                                const isSelected = selectedISO === iso;

                                let textClass = "";
                                let bgClass = "";

                                if (!inMonth) {
                                    textClass = "text-gray-300";
                                } else if (status === "available" && remaining > 0) {
                                    textClass = "text-green-800 font-semibold";
                                    bgClass = "bg-green-100";
                                } else if (status === "full") {
                                    textClass = "text-red-700 font-semibold";
                                    bgClass = "bg-red-100";
                                } else if (status === "blocked") {
                                    textClass = "text-gray-700 font-medium";
                                    bgClass = "bg-gray-300";
                                } else {
                                    textClass = "text-gray-400";
                                    bgClass = "bg-gray-50";
                                }

                                return (
                                    <button
                                        type="button"
                                        key={iso + idx}
                                        onClick={() => handleDayClick(date)}
                                        className={[
                                            "h-9 w-full rounded-md text-xs grid place-items-center transition",
                                            "border border-transparent hover:bg-gray-100/30",
                                            textClass,
                                            bgClass,
                                            isSelected ? "ring-2 ring-blue-400 font-bold" : "",
                                        ].join(" ")}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                </div>

                {/* Times */}
                <div className="md:col-span-5">
                    <h4 className="mb-2 font-medium text-gray-900">Available Times</h4>

                    {!serviceId ? (
                        <p className="text-sm text-gray-500">
                            Go back and select a service first.
                        </p>
                    ) : !formData.preferredDate ? (
                        <p className="text-sm text-gray-500">Select a date to view times.</p>
                    ) : availableTimes.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No times available for this date.
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
                            {availableTimes.map((slot) => {
                                const isFull = slot.remaining === 0;
                                return (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        disabled={isFull}
                                        onClick={() =>
                                            !isFull &&
                                            setFormData((prev) => ({
                                                ...prev,
                                                preferredTime: slot.time,
                                            }))
                                        }
                                        className={[
                                            "w-full px-3 py-2 rounded border text-sm flex items-center justify-between transition",
                                            isFull
                                                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                                : formData.preferredTime === slot.time
                                                    ? "bg-secondary text-white border-secondary"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100/30",
                                        ].join(" ")}
                                    >
                                        <span>{format12h(slot.time)}</span>
                                        <span className="text-xs font-medium">
                                            {isFull ? "Full Booked" : `${slot.remaining} slots left`}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ Legend outside the container */}
            <div className="flex flex-wrap gap-6 text-xs text-gray-600 pt-2">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-200 border border-green-500" />
                    Available
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-200 border border-red-500" />
                    Fully Booked
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-300 border border-gray-500" />
                    Blocked/Closed
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                    No Schedule
                </div>
            </div>
        </div>
    );
}
