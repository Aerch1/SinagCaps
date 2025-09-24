// src/components/common/availability/ManageAvailability.jsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Settings,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";

import {
    formatDate,
    getDaysInMonth,
    getFirstDayOfMonth,
} from "@/utils/availabilityUtils";

import WeeklyRulesPanel from "@/components/common/availability/WeeklyRulesPanel";
import CustomDatesPanel from "@/components/common/availability/CustomDatesPanel";
import CustomDateModal from "@/components/common/availability/CustomDateModal";
import ServiceManagement from "@/components/common/availability/ServiceManagement";
import Dropdown from "@/components/ui/Dropdown1"; // ✅ use your custom dropdown

export default function ManageAvailability() {
    const [topTab, setTopTab] = useState("availability");
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [activeTab, setActiveTab] = useState("weekly");
    const [viewDate, setViewDate] = useState(new Date());

    const [weeklyRules, setWeeklyRules] = useState({});
    const [customDates, setCustomDates] = useState({});
    const [blockedWeekdays, setBlockedWeekdays] = useState({});

    const [showCustomModal, setShowCustomModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    // 🔹 Fetch services from backend (only active ones for dropdown)
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch("/api/admin/services");
                const data = await res.json();
                if (data.success) {
                    const activeServices = data.services.filter((s) => s.active);
                    setServices(activeServices);
                    if (activeServices.length > 0) setSelectedService(activeServices[0]);
                }
            } catch (err) {
                console.error("❌ fetch services error:", err);
            }
        };
        fetchServices();
    }, []);

    // --- 📌 Unified Calendar Merge ---
    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const dim = getDaysInMonth(year, month);
        const first = getFirstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < first; i++) days.push({ isEmpty: true });

        for (let d = 1; d <= dim; d++) {
            const date = new Date(year, month, d);
            const iso = formatDate(date);
            const dow = date.getDay();

            let status = "neutral";
            let times = [];
            let conflict = false;

            const weekly = weeklyRules[dow] || [];
            const custom = customDates[iso];

            if (custom) {
                if (custom.status === "blocked") {
                    status = "blocked";
                } else {
                    const merged = [...weekly, ...(custom.times || [])];
                    const deduped = merged.reduce((acc, slot) => {
                        acc[slot.time] = slot;
                        return acc;
                    }, {});
                    times = Object.values(deduped).sort(
                        (a, b) =>
                            new Date(`1970-01-01 ${a.time}`) -
                            new Date(`1970-01-01 ${b.time}`)
                    );

                    status = times.length > 0 ? "available" : "available";
                    if (blockedWeekdays[dow]) conflict = true;
                }
            } else if (blockedWeekdays[dow]) {
                status = "blocked";
            } else if (weekly.length > 0) {
                times = weekly;
                status = "available";
            }

            days.push({ day: d, date: iso, status, times, conflict, isEmpty: false });
        }

        return days;
    }, [viewDate, weeklyRules, customDates, blockedWeekdays]);

    // --- 📌 Summary counts ---
    const summary = useMemo(() => {
        const blockedDays = Object.values(blockedWeekdays).filter(Boolean).length;
        const customCount = Object.keys(customDates).length;

        const totalSlots = calendarData.reduce((sum, day) => {
            if (day.isEmpty || !day.times) return sum;
            return sum + day.times.reduce((s, t) => s + t.slots, 0);
        }, 0);

        const activeDays = calendarData.filter(
            (d) => !d.isEmpty && d.status === "available"
        ).length;

        return { activeDays, blockedDays, customCount, totalSlots };
    }, [calendarData, blockedWeekdays, customDates]);

    // --- 📌 Calendar nav ---
    const handlePrevMonth = () =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const handleDayClick = (day) => {
        if (!day.isEmpty && day.date) {
            setSelectedDate(day.date);
            setShowCustomModal(true);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "available":
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            case "unavailable":
                return <Clock className="h-4 w-4 text-amber-600" />;
            case "blocked":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getCellClasses = (status, isEmpty = false) => {
        if (isEmpty) return "bg-gray-50/30";
        const base =
            "border transition-all duration-200 hover:shadow-sm cursor-pointer rounded-lg";
        switch (status) {
            case "available":
                return `${base} bg-emerald-50 hover:bg-emerald-100 border-emerald-200`;
            case "unavailable":
                return `${base} bg-amber-50 hover:bg-amber-100 border-amber-200`;
            case "blocked":
                return `${base} bg-red-50 hover:bg-red-100 border-red-200`;
            default:
                return `${base} bg-white hover:bg-gray-50 border-gray-200`;
        }
    };

    return (
        <div className="mx-auto space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                        Service Availability Management
                    </h1>
                    <p className="mt-1 text-xs md:text-sm text-gray-500">
                        Configure schedules, manage time slots, and set custom availability
                        rules
                    </p>
                </div>
            </div>

            {/* Top Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    {[
                        { id: "availability", label: "Availability Calendar", icon: Calendar },
                        { id: "services", label: "Service Management", icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setTopTab(tab.id)}
                            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 ${topTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {topTab === "services" ? (
                <ServiceManagement />
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Service Selector */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Select Service
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Choose a service to configure its availability
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Dropdown
                                    value={selectedService?.id ?? ""}
                                    onChange={(id) => {
                                        const svc = services.find((s) => s.id === id);
                                        setSelectedService(svc || null);
                                    }}
                                    options={services.map((svc) => ({
                                        value: svc.id,
                                        label: svc.name,
                                    }))}
                                    placeholder="Select service..."
                                    width="w-52"
                                />
                            </div>
                        </div>

                        {/* 📌 Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-900">
                                    {summary.activeDays}
                                </span>{" "}
                                days with availability
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-900">
                                    {summary.blockedDays}
                                </span>{" "}
                                weekdays blocked
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-900">
                                    {summary.customCount}
                                </span>{" "}
                                custom dates
                            </div>
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-900">
                                    {summary.totalSlots}
                                </span>{" "}
                                total slots this month
                            </div>
                        </div>
                    </div>

                    {/* Panels + Calendar */}
                    {selectedService && (
                        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 md:gap-6">
                            {/* Panel (wider) */}
                            <div className="xl:col-span-2">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                    <div className="border-b border-gray-200 flex">
                                        <button
                                            onClick={() => setActiveTab("weekly")}
                                            className={`flex-1 px-3 md:px-4 py-3 text-sm font-medium border-b-2 ${activeTab === "weekly"
                                                    ? "border-blue-500 text-blue-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Weekly Rules
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("custom")}
                                            className={`flex-1 px-3 md:px-4 py-3 text-sm font-medium border-b-2 ${activeTab === "custom"
                                                    ? "border-blue-500 text-blue-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Custom Dates
                                        </button>
                                    </div>
                                    <div className="p-4 md:p-4">
                                        {activeTab === "weekly" ? (
                                            <WeeklyRulesPanel
                                                weeklyRules={weeklyRules}
                                                setWeeklyRules={setWeeklyRules}
                                                blockedWeekdays={blockedWeekdays}
                                                setBlockedWeekdays={setBlockedWeekdays}
                                                customDates={customDates}
                                            />
                                        ) : (
                                            <CustomDatesPanel
                                                customDates={customDates}
                                                setCustomDates={setCustomDates}
                                                setSelectedDate={setSelectedDate}
                                                setShowCustomModal={setShowCustomModal}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Calendar */}
                            <div className="xl:col-span-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {selectedService.name} Schedule
                                        </h2>
                                        <div className="flex items-center bg-white rounded-lg border border-gray-200">
                                            <button
                                                onClick={handlePrevMonth}
                                                className="p-2 hover:bg-gray-50 rounded-l-lg"
                                            >
                                                <ChevronLeft className="h-4 w-4 text-gray-600" />
                                            </button>
                                            <div className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[140px] text-center border-x border-gray-200">
                                                {viewDate.toLocaleDateString("en-US", {
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <button
                                                onClick={handleNextMonth}
                                                className="p-2 hover:bg-gray-50 rounded-r-lg"
                                            >
                                                <ChevronRight className="h-4 w-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Calendar days */}
                                    <div className="p-4 md:p-6">
                                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                                (d) => (
                                                    <div
                                                        key={d}
                                                        className="text-center text-xs md:text-sm font-medium text-gray-500"
                                                    >
                                                        {d}
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                                            {calendarData.map((cell, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleDayClick(cell)}
                                                    className={`min-h-[4.5rem] md:min-h-[5.5rem] p-2 ${getCellClasses(
                                                        cell.status,
                                                        cell.isEmpty
                                                    )}`}
                                                >
                                                    {!cell.isEmpty && (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs md:text-sm font-medium text-gray-900">
                                                                    {cell.day}
                                                                </span>
                                                                {getStatusIcon(cell.status)}
                                                            </div>
                                                            <div className="text-xs space-y-1">
                                                                {cell.times.map((slot, i) => (
                                                                    <div
                                                                        key={`${slot.time}-${i}`}
                                                                        className="text-gray-800 font-medium text-center py-0.5"
                                                                    >
                                                                        {slot.time} ({slot.slots})
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {cell.conflict && (
                                                                <div className="text-[10px] text-red-600 mt-1">
                                                                    ⚠ Weekly Blocked
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="border-t border-gray-200 p-4 md:p-6">
                                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                                            <LegendItem
                                                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                                label="Available"
                                            />
                                            <LegendItem
                                                icon={<XCircle className="h-4 w-4 text-red-600" />}
                                                label="Blocked"
                                            />
                                            <LegendItem
                                                icon={<AlertCircle className="h-4 w-4 text-gray-400" />}
                                                label="No Schedule"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showCustomModal && (
                <CustomDateModal
                    selectedDate={selectedDate}
                    customDates={customDates}
                    setCustomDates={setCustomDates}
                    blockedWeekdays={blockedWeekdays}
                    onClose={() => setShowCustomModal(false)}
                />
            )}
        </div>
    );
}

function LegendItem({ icon, label }) {
    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
            <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
            <div className="text-sm font-medium text-gray-900">{label}</div>
        </div>
    );
}
