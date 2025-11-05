"use client";

import { useEffect, useMemo, useState } from "react";
import Dropdown from "@/components/ui/Dropdown1.jsx";
import api from "@/api/api";
import toast from "react-hot-toast";
import { toISO } from "@/utils/index.js";

/* Helper: Convert 24h -> 12h */
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

    /* Load all services */
    useEffect(() => {
        const loadServices = async () => {
            try {
                const res = await api.get("/public/services");
                setServices(res.data || []);
            } catch (err) {
                console.error("❌ Failed to fetch services:", err);
                toast.error("Failed to load services");
            }
        };
        loadServices();
    }, []);

    /* Fetch month availability */
    useEffect(() => {
        if (!serviceId) return;
        const loadMonth = async () => {
            try {
                const res = await api.get(`/availability/${serviceId}/month/${year}/${month + 1}`);
                setMonthAvailability(res.data.days || {});
            } catch (err) {
                console.error("❌ Month availability error:", err);
                toast.error("Failed to load availability");
            }
        };
        loadMonth();
    }, [serviceId, year, month]);

    /* Fetch day times */
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
        <section className="bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        Check Availability
                    </h2>
                    <p className="text-gray-600 text-base max-w-2xl mx-auto">
                        Select a service to view available appointment slots and book your preferred time instantly
                    </p>
                </div>

                {/* Service Dropdown */}
                <div className="max-w-md mx-auto mb-12">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        placeholder="Select a service to get started"
                        className="w-full"
                    />
                </div>

                {/* Calendar and Time Slots Grid */}
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Calendar - Takes 3 columns */}
                    <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                aria-label="Previous month"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900">{monthLabel}</h3>
                            <button
                                onClick={() => changeMonth(1)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                aria-label="Next month"
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Calendar Body */}
                        <div className="p-6">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-2 mb-3">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                    <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarCells.map(({ date, inMonth }, idx) => {
                                    const iso = toISO(date);
                                    const data = getDayData(date);
                                    const isSelected = selectedDate === iso;
                                    const isToday = toISO(new Date()) === iso;

                                    let cellClasses = "relative h-12 rounded-lg text-sm font-medium transition-all duration-200 ";

                                    if (!inMonth) {
                                        cellClasses += "text-gray-300 bg-gray-50 cursor-not-allowed";
                                    } else if (data.status === "blocked") {
                                        cellClasses += "text-gray-400 bg-gray-100 cursor-not-allowed";
                                    } else if (data.status === "full") {
                                        cellClasses += "text-gray-500 bg-gray-50 cursor-not-allowed";
                                    } else if (data.status === "available" && data.remaining > 0) {
                                        cellClasses += "text-gray-900 bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer";
                                    } else {
                                        cellClasses += "text-gray-400 bg-white border border-gray-100";
                                    }

                                    if (isSelected) {
                                        cellClasses += " !border-blue-500 !bg-blue-50 shadow-lg scale-105";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleDayClick(date)}
                                            disabled={!inMonth || data.status === "blocked" || (data.status !== "available" && data.remaining === 0)}
                                            className={cellClasses}
                                        >
                                            <span className={isToday ? "font-bold" : ""}>{date.getDate()}</span>
                                            {data.status === "available" && data.remaining > 0 && (
                                                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="w-3 h-3 bg-white border-2 border-gray-200 rounded"></span>
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="w-3 h-3 bg-gray-50 border border-gray-300 rounded"></span>
                                    <span>Full</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>
                                    <span>Blocked</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time Slots - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-900 text-lg">
                                {selectedDate ? "Available Times" : "Time Slots"}
                            </h3>
                            {selectedDate && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="p-6">
                            {!selectedDate ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">Select a date to view available time slots</p>
                                </div>
                            ) : loading ? (
                                <div className="text-center py-12">
                                    <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                    <p className="text-gray-500 text-sm mt-4">Loading times...</p>
                                </div>
                            ) : availableTimes.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No available times for this date</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {availableTimes.map((slot) => (
                                        <button
                                            key={slot.time}
                                            disabled={slot.remaining === 0}
                                            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${slot.remaining === 0
                                                ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                                                : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`font-semibold ${slot.remaining === 0 ? "text-gray-400" : "text-gray-900"}`}>
                                                    {format12h(slot.time)}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${slot.remaining === 0
                                                    ? "bg-gray-200 text-gray-500"
                                                    : slot.remaining <= 2
                                                        ? "bg-orange-100 text-orange-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}>
                                                    {slot.remaining === 0 ? "Fully Booked" : `${slot.remaining} slot${slot.remaining > 1 ? 's' : ''} left`}
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