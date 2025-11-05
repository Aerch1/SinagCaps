/* ✅ Updated Typography to match ChurchBulletin */
"use client";

import { useEffect, useMemo, useState } from "react";
import Dropdown from "@/components/ui/Dropdown1.jsx";
import api from "@/api/api";
import toast from "react-hot-toast";
import { toISO } from "@/utils/index.js";

function format12h(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function ServiceAvailabilityPreview() {
    const [services, setServices] = useState([]);
    const [serviceId, setServiceId] = useState("");
    const [serviceName, setServiceName] = useState("");
    const [monthAvailability, setMonthAvailability] = useState({});
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const monthLabel = useMemo(
        () =>
            new Date(year, month, 1).toLocaleString("default", {
                month: "long",
                year: "numeric",
            }),
        [year, month]
    );

    useEffect(() => {
        const loadServices = async () => {
            try {
                const res = await api.get("/public/services");
                setServices(res.data?.services || []);
            } catch (err) {
                console.error("❌ Failed to fetch services:", err);
                toast.error("Failed to load services");
            }
        };
        loadServices();
    }, []);

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

    useEffect(() => {
        if (!selectedDate || !serviceId) return setAvailableTimes([]);
        const loadTimes = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/availability/${serviceId}/${selectedDate}`);
                setAvailableTimes(res.data.slots || []);
            } catch (err) {
                console.error("❌ Failed to load daily slots:", err);
                toast.error("Failed to load times");
            } finally {
                setLoading(false);
            }
        };
        loadTimes();
    }, [selectedDate, serviceId]);

    const changeMonth = (delta) => {
        const next = new Date(year, month + delta, 1);
        setYear(next.getFullYear());
        setMonth(next.getMonth());
        setMonthAvailability({});
        setAvailableTimes([]);
        setSelectedDate("");
    };

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

    const getDayData = (dateObj) => {
        const iso = toISO(dateObj);
        return monthAvailability[iso] || { status: "neutral", remaining: 0 };
    };

    const handleDayClick = (dateObj) => {
        if (!serviceId) return toast.error("Select a service first.");
        const iso = toISO(dateObj);
        const dayData = getDayData(dateObj);
        if (dayData.status === "blocked" || dayData.status === "none") return;
        setSelectedDate(iso);
    };

    return (
        <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        Check Availability
                    </h2>
                    <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Select a service to view available appointment slots and request a
                        schedule for your preferred time.
                    </p>
                </div>

                {/* Dropdown */}
                <div className="max-w-md mx-auto mb-10">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Choose Service
                    </label>
                    <Dropdown
                        value={serviceName}
                        onChange={(name) => {
                            const svc = services.find((s) => s.name === name);
                            if (!svc) return;
                            setServiceName(svc.name);
                            setServiceId(svc.id);
                            setMonthAvailability({});
                            setAvailableTimes([]);
                            setSelectedDate("");
                        }}
                        options={services.map((s) => s.name)}
                        placeholder="Select a service"
                        className="w-full"
                    />
                </div>

                {/* Grid */}
                <div className="grid lg:grid-cols-5 gap-8">
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
                                    const isSelected = selectedDate === iso;
                                    const isToday = toISO(new Date()) === iso;

                                    let cellClasses =
                                        "relative h-12 rounded-lg text-sm font-medium transition-all duration-200 ";

                                    if (!inMonth) {
                                        cellClasses += "text-slate-300 bg-slate-50 cursor-not-allowed";
                                    } else if (data.status === "blocked") {
                                        cellClasses += "text-slate-400 bg-slate-100 cursor-not-allowed";
                                    } else if (data.status === "full") {
                                        cellClasses += "text-slate-500 bg-slate-50 cursor-not-allowed";
                                    }
                                    // 🟩 Change: Available day cell turns green
                                    else if (data.status === "available" && data.remaining > 0) {
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
                                {selectedDate ? "Available Times" : "Time Slots"}
                            </h3>
                            {selectedDate && (
                                <p className="text-sm text-slate-600 mt-1">
                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(
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
                            {!selectedDate ? (
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
                                    {availableTimes.map((slot) => (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            disabled={slot.remaining === 0}
                                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${slot.remaining === 0
                                                ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                                                : "bg-white border-slate-200 hover:border-red-400 hover:shadow-md cursor-pointer"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span
                                                    className={`font-semibold ${slot.remaining === 0
                                                        ? "text-slate-400"
                                                        : "text-slate-900"
                                                        }`}
                                                >
                                                    {format12h(slot.time)}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full font-medium ${slot.remaining === 0
                                                        ? "bg-slate-200 text-slate-500"
                                                        : slot.remaining <= 2
                                                            ? "bg-orange-100 text-orange-700"
                                                            : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {slot.remaining === 0
                                                        ? "Fully Booked"
                                                        : `${slot.remaining} slot${slot.remaining > 1 ? "s" : ""
                                                        } left`}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
