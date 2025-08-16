"use client";

import { useEffect, useMemo, useState } from "react";

export default function Step1ServiceDate({ formData, setFormData }) {
    const now = new Date();

    // Visible month/year in the calendar
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()); // 0-11

    // Cache availability per SERVICE and MONTH:
    // { [service]: { [YYYY-MM]: { [YYYY-MM-DD]: { status, times[] } } } }
    const [monthMaps, setMonthMaps] = useState({});

    // Times for the selected date
    const [availableTimes, setAvailableTimes] = useState([]);

    // ---------- Helpers ----------
    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstDayOfWeek = (y, m) => new Date(y, m, 1).getDay(); // 0=Sun...6=Sat
    const lastDayOfWeek = (y, m) => new Date(y, m, daysInMonth(y, m)).getDay();
    const pad2 = (n) => String(n).padStart(2, "0");
    const monthKey = (y, m) => `${y}-${pad2(m + 1)}`;
    const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const fromISO = (iso) => { const [Y, M, D] = iso.split("-").map(Number); return new Date(Y, M - 1, D); };
    const isSameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

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

    // ---------- BACKEND-READY LOADER ----------
    // API shape:
    // GET /api/availability/month?service={service}&year={yyyy}&month={1..12}
    // -> { month:"YYYY-MM", days:[{date:"YYYY-MM-DD", status:"available|blocked|unavailable", times:[..]}] }
    async function loadMonth(service, y, m) {
        if (!service) return;
        const key = monthKey(y, m);
        const svcMaps = monthMaps[service] || {};
        if (svcMaps[key]) return; // already loaded for this service

        const USE_MOCK = true;
        let payload;

        if (USE_MOCK) {
            payload = mockMonthPayload(service, y, m);
        } else {
            const res = await fetch(`/api/availability/month?service=${encodeURIComponent(service)}&year=${y}&month=${m + 1}`);
            if (!res.ok) throw new Error("Failed to load month availability");
            payload = await res.json();
        }

        const map = {};
        (payload.days || []).forEach((d) => {
            map[d.date] = { status: d.status, times: d.times || [] };
        });

        setMonthMaps((prev) => ({
            ...prev,
            [service]: {
                ...(prev[service] || {}),
                [key]: map,
            },
        }));
    }

    // ---------- MOCK MONTH PAYLOAD (explicit per-date control) ----------
    // Varied times PER SERVICE and PER DATE.
    function mockMonthPayload(service, y, m) {
        const key = monthKey(y, m);
        const dim = daysInMonth(y, m);

        // time sets to mix & match
        const S = {
            A: ["08:00 AM", "10:00 AM"],
            B: ["11:00 AM", "03:00 PM"],
            C: ["09:30 AM", "01:30 PM"],
            D: ["08:30 AM", "10:30 AM", "02:00 PM"],
            E: ["07:30 AM", "09:00 AM"],
            F: ["10:00 AM", "01:00 PM", "03:30 PM"],
            G: ["05:00 PM", "06:30 PM"],
            H: ["04:00 PM", "05:00 PM", "06:00 PM"],
        };

        const pickTimes = (svc, dow, day) => {
            switch (svc) {
                case "baptism":
                    if (dow === 6) return S.D;
                    return day % 2 === 0 ? S.A : S.B;
                case "confirmation":
                    return [1, 3, 5].includes(dow) ? S.A : S.B;
                case "marriage":
                    if (dow === 6) return S.F;
                    return day % 3 === 0 ? S.C : S.A;
                case "confession":
                    return day % 2 === 0 ? S.H : S.G;
                case "anointing":
                    return dow === 2 ? S.C : S.E;
                default:
                    return S.A;
            }
        };

        const days = [];
        for (let d = 1; d <= dim; d++) {
            const iso = `${key}-${pad2(d)}`;
            const dow = new Date(y, m, d).getDay(); // 0=Sun

            const isClosed = dow === 0 || [14, 28].includes(d); // Sundays + closures -> RED
            if (isClosed) {
                days.push({ date: iso, status: "blocked", times: [] });
                continue;
            }

            const isAvailable =
                (service === "baptism" && (d % 3 === 2 || dow === 6)) ||
                (service === "confirmation" && [1, 2, 3, 4, 5].includes(dow)) ||
                (service === "marriage" && (dow === 6 || d % 3 === 0)) ||
                (service === "confession" && d % 2 === 0) ||
                (service === "anointing" && [2, 4].includes(dow));

            if (isAvailable) {
                days.push({ date: iso, status: "available", times: pickTimes(service, dow, d) });
            } else {
                days.push({ date: iso, status: "unavailable", times: [] });
            }
        }

        return { month: key, days };
    }

    // ---------- Build grid with MINIMAL overflow ----------
    // Leading: prev month days up to the first row start.
    // Trailing: next month days only to complete the last week (up to Saturday).
    const calendarCells = useMemo(() => {
        const cells = [];
        const startDow = firstDayOfWeek(year, month);
        const endDow = lastDayOfWeek(year, month);
        const dim = daysInMonth(year, month);
        const dimPrev = daysInMonth(year, month - 1);

        // Prev overflow (leading)
        for (let i = startDow - 1; i >= 0; i--) {
            const day = dimPrev - i;
            cells.push({ date: new Date(year, month - 1, day) });
        }
        // Current month
        for (let d = 1; d <= dim; d++) {
            cells.push({ date: new Date(year, month, d) });
        }
        // Next overflow (trailing) — only until Saturday
        const trailing = 6 - endDow; // how many days needed to finish the last row
        for (let i = 1; i <= trailing; i++) {
            cells.push({ date: new Date(year, month + 1, i) });
        }
        return cells;
    }, [year, month]);

    // Prefetch current, prev, next for the SELECTED service
    useEffect(() => {
        if (!formData.serviceType) return;
        const cur = new Date(year, month, 1);
        const prev = new Date(year, month - 1, 1);
        const next = new Date(year, month + 1, 1);
        (async () => {
            await loadMonth(formData.serviceType, cur.getFullYear(), cur.getMonth());
            await loadMonth(formData.serviceType, prev.getFullYear(), prev.getMonth());
            await loadMonth(formData.serviceType, next.getFullYear(), next.getMonth());
        })();
    }, [formData.serviceType, year, month]);

    // Reset selection when service changes
    useEffect(() => {
        setFormData((p) => ({ ...p, preferredDate: "", preferredTime: "" }));
        setAvailableTimes([]);
    }, [formData.serviceType]);

    // Load times when date changes (read from service-specific monthMaps)
    useEffect(() => {
        if (!formData.preferredDate || !formData.serviceType) {
            setAvailableTimes([]);
            return;
        }
        const d = fromISO(formData.preferredDate);
        const mk = monthKey(d.getFullYear(), d.getMonth());
        const entry = monthMaps[formData.serviceType]?.[mk]?.[formData.preferredDate];
        setAvailableTimes(entry?.status === "available" ? entry.times || [] : []);
    }, [formData.preferredDate, formData.serviceType, monthMaps]);

    // Resolve date status from DATA for the current service
    function getStatusFor(dateObj) {
        if (!formData.serviceType) return "unavailable";
        const mk = monthKey(dateObj.getFullYear(), dateObj.getMonth());
        const iso = toISO(dateObj);
        const entry = monthMaps[formData.serviceType]?.[mk]?.[iso];
        return entry?.status || "unavailable";
    }

    // ---------- Handlers ----------
    const handleDayClick = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth();

        // If clicking overflow day, switch the visible month to that month
        if (m !== month || y !== year) {
            setYear(y);
            setMonth(m);
        }

        const iso = toISO(dateObj);
        setFormData((prev) => ({ ...prev, preferredDate: iso, preferredTime: "" }));
    };

    const selectedISO = formData.preferredDate;
    const selectedTime = formData.preferredTime;

    return (
        <div className="space-y-4">
            {/* Three columns: Service types / Calendar / Times */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Column 1: Service types */}
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Type
                    </label>

                    <div className="relative">
                        <select
                            className="
        service-select
        block w-full appearance-none rounded-md
        border border-gray-300 bg-white
        px-3 pr-9 py-2.5
        text-sm text-gray-800 placeholder-gray-400
        shadow-sm
        hover:border-gray-400
        focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300
        disabled:opacity-50
        transition-colors
      "
                            value={formData.serviceType}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    serviceType: e.target.value,
                                    preferredDate: "",
                                    preferredTime: "",
                                }))
                            }
                        >
                            <option value="">Select service</option>
                            <option value="baptism">Baptism</option>
                            <option value="confirmation">Confirmation</option>
                            <option value="marriage">Marriage</option>
                            <option value="confession">Confession</option>
                            <option value="anointing">Anointing of the Sick</option>
                        </select>

                        {/* chevron */}
                        <svg
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                        >
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>


                {/* Column 2: Calendar */}
                <div className="md:col-span-6 border border-gray-200 rounded-md p-4">
                    {/* Month header */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                        <button onClick={() => changeMonth(-1)} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Previous month">&larr;</button>
                        <span className="text-gray-800 font-medium">{monthLabel}</span>
                        <button onClick={() => changeMonth(1)} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Next month">&rarr;</button>
                    </div>

                    {/* Weekday labels */}
                    <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-gray-500">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => <div key={w} className="text-center">{w}</div>)}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell, idx) => {
                            const iso = toISO(cell.date);
                            const inMonth = cell.date.getMonth() === month && cell.date.getFullYear() === year;
                            const status = getStatusFor(cell.date); // "available" | "blocked" | "unavailable"
                            const isSelected = selectedISO === iso;
                            const isToday = isSameDate(cell.date, now);

                            // --- Styling rules ---
                            let textClass = "";
                            let bgClass = "";

                            if (inMonth) {
                                // In-month: color by status with text
                                textClass = "text-gray-800 font-medium";
                                if (status === "available") textClass = "font-medium text-emerald-600";
                                if (status === "blocked") textClass = "text-red-500 font-medium";
                            } else {
                                // Overflow: neutral numbers; background carries status if scheduled
                                if (status === "available") {
                                    textClass = "text-gray-400";      // neutral overflow number
                                    bgClass = "bg-emerald-50";       // light green background
                                } else if (status === "blocked") {
                                    textClass = "text-gray-400";      // neutral overflow number
                                    bgClass = "bg-red-50";           // light red background
                                } else {
                                    textClass = "text-gray-300";      // lighter gray when no schedule
                                }
                            }

                            // Today highlight (overrides other BGs)
                            if (isToday) {
                                bgClass = "bg-sky-100";
                            }

                            return (
                                <button
                                    type="button"
                                    key={iso + idx}
                                    onClick={() => handleDayClick(cell.date)}
                                    className={[
                                        "h-9 w-full rounded-md text-xs grid place-items-center cursor-pointer select-none",
                                        "border border-transparent hover:bg-blue-50 hover:border-blue-200 transition",
                                        textClass,
                                        bgClass,
                                        isSelected ? "ring-1 ring-emerald-500 font-medium" : ""
                                    ].join(" ")}
                                    title={iso}
                                >
                                    {cell.date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend centered under calendar */}
                    <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-emerald-50 border border-emerald-500" />
                            <span className="text-emerald-700">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-50 border border-red-500" />
                            <span className="text-red-600">Not available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-full bg-sky-100 border border-sky-300" />
                            <span className="text-sky-700">Today</span>
                        </div>
                    </div>
                </div>

                {/* Column 3: Available Times (stacked) */}
                <div className="md:col-span-3">
                    <h4 className="mb-2 font-medium text-gray-800">Available Times</h4>

                    {!formData.serviceType ? (
                        <p className="text-sm text-gray-500">Select a service to see availability.</p>
                    ) : !formData.preferredDate ? (
                        <p className="text-sm text-gray-500">Select a date.</p>
                    ) : availableTimes.length === 0 ? (
                        <p className="text-sm text-gray-500">No times available for this date.</p>
                    ) : (
                        <div className="space-y-2">
                            {availableTimes.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, preferredTime: t }))}
                                    className={[
                                        "w-full px-3 py-2 rounded border text-sm text-left transition",
                                        selectedTime === t
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-200",
                                    ].join(" ")}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
