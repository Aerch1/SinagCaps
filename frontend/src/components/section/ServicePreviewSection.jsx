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

    // 📦 Load all services for dropdown
    useEffect(() => {
        const loadServices = async () => {
            try {
                // ✅ match AppointmentPage.jsx
                const res = await api.get("/public/services");
                setServices(res.data?.services || []);
            } catch (err) {
                console.error("❌ Failed to fetch services:", err);
                toast.error("Failed to load services");
            }
        };
        loadServices();
    }, []);

    // 📅 Fetch monthly availability for selected service
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

    // 🕒 Fetch available times for selected day
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
        <section className="bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Service Availability
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Check available slots by selecting a service.
                    </p>
                </div>

                {/* Service Selector */}
                <div className="max-w-md mx-auto mb-8">
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

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                type="button"
                                onClick={() => changeMonth(-1)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                ←
                            </button>
                            <h4 className="font-semibold text-gray-900">{monthLabel}</h4>
                            <button
                                type="button"
                                onClick={() => changeMonth(1)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                →
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-1">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                <div key={d} className="text-center font-medium">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarCells.map(({ date, inMonth }, idx) => {
                                const iso = toISO(date);
                                const data = getDayData(date);
                                const isSelected = selectedDate === iso;

                                let text = "text-gray-400";
                                let bg = "bg-gray-50";

                                if (data.status === "available" && data.remaining > 0) {
                                    text = "text-green-800 font-semibold";
                                    bg = "bg-green-100";
                                } else if (data.status === "full") {
                                    text = "text-red-700 font-semibold";
                                    bg = "bg-red-100";
                                } else if (data.status === "blocked") {
                                    text = "text-gray-600 font-medium";
                                    bg = "bg-gray-300";
                                }

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleDayClick(date)}
                                        className={[
                                            "h-9 w-full rounded text-xs grid place-items-center border transition",
                                            text,
                                            bg,
                                            isSelected ? "ring-2 ring-blue-400 font-bold" : "",
                                            !inMonth ? "opacity-50" : "",
                                        ].join(" ")}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-200 border border-green-500 rounded" /> Available
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-red-200 border border-red-500 rounded" /> Full
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-gray-300 border border-gray-500 rounded" /> Blocked
                            </div>
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-3">
                            {selectedDate
                                ? `Available Times (${selectedDate})`
                                : "Select a date to view times"}
                        </h4>

                        {loading ? (
                            <p className="text-sm text-gray-500">Loading times...</p>
                        ) : availableTimes.length === 0 ? (
                            <p className="text-sm text-gray-500">No times available.</p>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {availableTimes.map((slot) => (
                                    <div
                                        key={slot.time}
                                        className={`p-3 rounded border text-sm flex justify-between ${slot.remaining === 0
                                                ? "bg-gray-100 text-gray-400 border-gray-300"
                                                : "bg-green-50 text-green-800 border-green-200"
                                            }`}
                                    >
                                        <span>{format12h(slot.time)}</span>
                                        <span className="text-xs font-medium">
                                            {slot.remaining === 0
                                                ? "Full"
                                                : `${slot.remaining} slot(s) left`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
