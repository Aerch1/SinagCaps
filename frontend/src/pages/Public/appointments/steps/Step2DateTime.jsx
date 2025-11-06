"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Dropdown from "../../../../components/ui/Dropdown1.jsx";
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

export default function Step2DateTime({ formData, setFormData, services = [] }) {
    const now = useMemo(() => new Date(), []);
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [monthAvailability, setMonthAvailability] = useState({});
    const [availableTimes, setAvailableTimes] = useState([]);
    const [loading, setLoading] = useState(false);

    const serviceId = formData.service_id || "";

    const monthLabel = useMemo(
        () =>
            new Date(year, month, 1).toLocaleString("default", {
                month: "long",
                year: "numeric",
            }),
        [year, month]
    );

    const changeMonth = useCallback((delta) => {
        setYear((prevY) => {
            const n = new Date(prevY, month + delta, 1);
            setMonth(n.getMonth());
            setAvailableTimes([]);
            return n.getFullYear();
        });
    }, [month]);

    const onServiceChange = useCallback(
        (label) => {
            const picked = services.find((s) => s.name === label);
            if (!picked) return;

            setFormData((prev) => ({
                ...prev,
                service_id: picked.id,
                formType: picked.form_type || "default",
                serviceName: picked.name,
                preferredDate: prev.service_id !== picked.id ? "" : prev.preferredDate,
                preferredTime: prev.service_id !== picked.id ? "" : prev.preferredTime,
                extraData: {},
            }));

            setMonthAvailability({});
            setAvailableTimes([]);
        },
        [services, setFormData]
    );

    /* Load month availability */
    useEffect(() => {
        if (!serviceId) return;
        let cancel = false;
        const loadMonth = async () => {
            try {
                const res = await api.get(`/availability/${serviceId}/month/${year}/${month + 1}`);
                if (!cancel) setMonthAvailability(res.data.days || {});
            } catch (err) {
                if (!cancel) toast.error("Failed to load availability");
                console.error("❌ Month availability error:", err);
            }
        };
        loadMonth();
        return () => {
            cancel = true;
        };
    }, [serviceId, year, month]);

    /* Load daily slots */
    useEffect(() => {
        if (!formData.preferredDate || !serviceId) {
            setAvailableTimes([]);
            return;
        }
        let cancel = false;
        const loadTimes = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/availability/${serviceId}/${formData.preferredDate}`);
                if (!cancel) setAvailableTimes(res.data.slots || []);
            } catch (err) {
                if (!cancel) toast.error("Failed to load times");
                console.error("❌ Daily slots error:", err);
                setAvailableTimes([]);
            } finally {
                if (!cancel) setLoading(false);
            }
        };
        loadTimes();
        return () => {
            cancel = true;
        };
    }, [formData.preferredDate, serviceId]);

    const getDayData = useCallback(
        (dateObj) => {
            if (!serviceId) return { status: "neutral", remaining: 0 };
            const iso = toISO(dateObj);
            return monthAvailability[iso] || { status: "neutral", remaining: 0 };
        },
        [serviceId, monthAvailability]
    );

    const handleDayClick = useCallback(
        (dateObj) => {
            const dayData = getDayData(dateObj);
            if (dayData.status === "blocked" || dayData.status === "none") return;
            const iso = toISO(dateObj);
            setFormData((prev) => ({ ...prev, preferredDate: iso, preferredTime: "" }));
        },
        [getDayData, setFormData]
    );

    const calendarCells = useMemo(() => {
        const cells = [];
        const first = new Date(year, month, 1);
        const startDow = first.getDay();
        const dim = new Date(year, month + 1, 0).getDate();

        // previous month filler
        for (let i = 0; i < startDow; i++) {
            const d = new Date(year, month, -i);
            cells.unshift({ date: d, inMonth: false });
        }
        // current month
        for (let d = 1; d <= dim; d++) {
            cells.push({ date: new Date(year, month, d), inMonth: true });
        }
        // next month filler
        while (cells.length < 42) {
            const last = cells[cells.length - 1].date;
            const next = new Date(last);
            next.setDate(last.getDate() + 1);
            cells.push({ date: next, inMonth: false });
        }
        return cells;
    }, [year, month]);

    const selectedISO = formData.preferredDate;

    return (
        <div className="space-y-6">
            {/* Service Selector */}
            <div className="md:col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selected Service
                </label>
                <Dropdown
                    value={formData.serviceName || ""}
                    onChange={onServiceChange}
                    options={services.map((s) => s.name)}
                    placeholder="Select a service"
                    className="w-full"
                />
            </div>

            {/* Calendar & Times Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-slate-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <h3 className="text-base font-semibold text-slate-900">
                            {monthLabel}
                        </h3>
                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-slate-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Calendar Body */}
                    <div className="p-6">
                        <div className="grid grid-cols-7 gap-2 mb-3">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div
                                    key={d}
                                    className="text-center text-xs font-semibold text-slate-500"
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-slate-700">
                            {calendarCells.map(({ date, inMonth }, idx) => {
                                const iso = toISO(date);
                                const data = getDayData(date);
                                const isSelected = selectedISO === iso;
                                const isToday = toISO(new Date()) === iso;

                                let cellClasses =
                                    "relative h-12 rounded-lg text-sm font-medium transition-all duration-200 ";

                                if (!inMonth) {
                                    cellClasses += "text-slate-300 bg-slate-50 cursor-not-allowed";
                                } else if (data.status === "blocked") {
                                    cellClasses += "text-slate-400 bg-slate-100 cursor-not-allowed";
                                } else if (data.status === "full") {
                                    cellClasses += "text-slate-500 bg-slate-50 cursor-not-allowed";
                                } else if (data.status === "available" && data.remaining > 0) {
                                    cellClasses +=
                                        "bg-green-100 text-green-800 font-semibold hover:bg-green-200 cursor-pointer";
                                } else {
                                    cellClasses += "text-slate-400 bg-white border border-slate-300";
                                }

                                if (isSelected) {
                                    cellClasses += " !border-red-500 !bg-red-50 shadow-lg scale-105";
                                }

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleDayClick(date)}
                                        disabled={
                                            !inMonth ||
                                            data.status === "blocked" ||
                                            (data.status !== "available" && data.remaining === 0)
                                        }
                                        className={cellClasses}
                                    >
                                        <span className={isToday ? "font-bold" : ""}>
                                            {date.getDate()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="font-semibold text-slate-900 text-base">
                            {formData.preferredDate ? "Available Times" : "Time Slots"}
                        </h3>
                        {formData.preferredDate && (
                            <p className="text-sm text-slate-600 mt-1">
                                {new Date(formData.preferredDate + "T00:00:00").toLocaleDateString(
                                    "en-US",
                                    {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                    }
                                )}
                            </p>
                        )}
                    </div>

                    <div className="p-6 text-slate-700">
                        {!serviceId ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 text-sm">
                                    Select a service first
                                </p>
                            </div>
                        ) : !formData.preferredDate ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 text-sm">
                                    Select a date to view available time slots
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-red-500 rounded-full animate-spin"></div>
                                <p className="text-slate-500 text-sm mt-4">Loading times...</p>
                            </div>
                        ) : availableTimes.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-500 text-sm">
                                    No available times for this date
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin">
                                {availableTimes.map((slot) => {
                                    const isFull = slot.remaining === 0;
                                    const isSelected = formData.preferredTime === slot.time;
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
                                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                                isFull
                                                    ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                                                    : isSelected
                                                    ? "bg-red-50 border-red-500 shadow-md"
                                                    : "bg-white border-slate-200 hover:border-red-400 hover:shadow-md cursor-pointer"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span
                                                    className={`font-semibold ${
                                                        isFull
                                                            ? "text-slate-400"
                                                            : isSelected
                                                            ? "text-red-700"
                                                            : "text-slate-900"
                                                    }`}
                                                >
                                                    {format12h(slot.time)}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        isFull
                                                            ? "bg-slate-200 text-slate-500"
                                                            : slot.remaining <= 2
                                                            ? "bg-orange-100 text-orange-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                                    {isFull
                                                        ? "Fully Booked"
                                                        : `${slot.remaining} slot${
                                                              slot.remaining > 1 ? "s" : ""
                                                          } left`}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-xs text-slate-600 pt-2">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-slate-50 border-2 border-slate-300" />
                    <span>Fully Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-400" />
                    <span>Blocked/Closed</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-white border-2 border-slate-300" />
                    <span>No Schedule</span>
                </div>
            </div>
        </div>
    );
}