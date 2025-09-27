"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Calendar as CalIcon,
    ChevronLeft,
    ChevronRight,
    Settings,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react";

import WeeklyRulesPanel from "@/components/common/availability/WeeklyRulesPanel";
import CustomDatesPanel from "@/components/common/availability/CustomDatesPanel";
import CustomDateModal from "@/components/common/availability/CustomDateModal";
import ServiceManagement from "@/components/common/availability/ServiceManagement";
import Dropdown from "@/components/ui/Dropdown1";
import {
    getDaysInMonth,
    getFirstDayOfMonth,
    formatDate,
    to12h,
} from "@/utils/availabilityUtils";
import { useAdminAvailabilityStore } from "../../store/adminAvailabilityStore.js";
import useChurchHours from "@/hooks/useChurchHours";

export default function ManageAvailability() {
    const [topTab, setTopTab] = useState("availability");
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [activeTab, setActiveTab] = useState("weekly");
    const [viewDate, setViewDate] = useState(new Date());

    const [showCustomModal, setShowCustomModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedRule, setSelectedRule] = useState(null);

    const { churchHours } = useChurchHours();
    const { rules = [], fetchRules } = useAdminAvailabilityStore();

    /* -------- Load persisted selection -------- */
    useEffect(() => {
        const saved = localStorage.getItem("selectedServiceId");
        if (saved) {
            setSelectedService({ id: Number(saved) });
        }
    }, []);

    /* -------- Fetch services -------- */
    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/services");
            const data = await res.json();
            if (data.success) {
                const active = data.services.filter((s) => s.active);
                setServices(active);

                // restore selection if still exists
                const savedId = localStorage.getItem("selectedServiceId");
                const match =
                    savedId && active.find((s) => String(s.id) === String(savedId));
                if (match) {
                    setSelectedService(match);
                } else if (active.length > 0 && !selectedService) {
                    setSelectedService(active[0]);
                    localStorage.setItem("selectedServiceId", active[0].id);
                }
            }
        } catch (e) {
            console.error("❌ services", e);
        }
    }, [selectedService]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    /* -------- Persist selection when it changes -------- */
    useEffect(() => {
        if (selectedService?.id) {
            localStorage.setItem("selectedServiceId", selectedService.id);
            fetchRules(selectedService.id);
        }
    }, [selectedService, fetchRules]);

    /* -------- Calendar generation (weekly + custom merge) -------- */
    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const dim = getDaysInMonth(year, month);
        const first = getFirstDayOfMonth(year, month);
        const days = [];

        const normalizeRule = (rule, dow) => {
            if (rule.type === "single") {
                return {
                    type: "single",
                    time: rule.time ? rule.time.slice(0, 5) : null,
                    slots: rule.slots,
                    status: rule.status,
                };
            }
            if (rule.type === "recurring") {
                return {
                    type: "recurring",
                    start: rule.start,
                    end: rule.end,
                    interval_mins: rule.interval_mins,
                    slots: rule.slots,
                    status: rule.status,
                };
            }
            if (rule.type === "allday") {
                const hours = churchHours?.[dow];
                const start = rule.start || hours?.open_time || null;
                const end = rule.end || hours?.close_time || null;
                return {
                    type: "allday",
                    start,
                    end,
                    slots: rule.slots,
                    status: rule.status,
                };
            }
            return null;
        };

        for (let i = 0; i < first; i++) days.push({ isEmpty: true });

        for (let d = 1; d <= dim; d++) {
            const date = new Date(year, month, d);
            const dow = date.getDay();
            const iso = formatDate(date);

            let status = "neutral";
            let items = [];

            const weekly = rules.filter((r) => r.weekday === dow && !r.date);
            const custom = rules.filter((r) => formatDate(r.date) === iso);

            const weeklyNorm = weekly.map((r) => normalizeRule(r, dow)).filter(Boolean);
            const customNorm = custom.map((r) => normalizeRule(r, dow)).filter(Boolean);

            const weeklyBlocked = weeklyNorm.some(
                (r) => r.type === "allday" && r.status === "blocked"
            );
            const customBlocked = customNorm.some(
                (r) => r.type === "allday" && r.status === "blocked"
            );

            const weeklyAllDayAvail = weeklyNorm.find(
                (r) => r.type === "allday" && r.status === "available"
            );
            const customAllDayAvail = customNorm.find(
                (r) => r.type === "allday" && r.status === "available"
            );

            if (customBlocked || weeklyBlocked) {
                status = "blocked";
                items = [{ type: "allday", status: "blocked" }];
            } else if (customAllDayAvail || weeklyAllDayAvail) {
                status = "available";
                const chosen = customAllDayAvail || weeklyAllDayAvail;
                items = [
                    {
                        type: "allday",
                        status: "available",
                        start: chosen.start || null,
                        end: chosen.end || null,
                    },
                ];
            } else {
                const additive = [
                    ...weeklyNorm.filter((r) => r.type !== "allday"),
                    ...customNorm.filter((r) => r.type !== "allday"),
                ];
                if (additive.length > 0) {
                    status = "available";
                    items = additive;
                }
            }

            days.push({
                isEmpty: false,
                day: d,
                date: iso,
                status,
                items,
            });
        }

        return days;
    }, [viewDate, rules, churchHours]);

    const summary = useMemo(() => {
        const activeDays = calendarData.filter(
            (c) => !c.isEmpty && c.status === "available"
        ).length;
        const blockedDays = rules.filter(
            (r) => r && r.type === "allday" && r.status === "blocked" && !r.date
        ).length;
        const customCount = rules.filter((r) => !!r.date).length;

        const totalSlots = calendarData.reduce((sum, c) => {
            if (c.isEmpty || !c.items) return sum;
            return (
                sum +
                c.items.reduce((s, it) => {
                    if (it.type === "single") return s + (it.slots || 0);
                    return s;
                }, 0)
            );
        }, 0);

        return { activeDays, blockedDays, customCount, totalSlots };
    }, [calendarData, rules]);

    const handlePrevMonth = () =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () =>
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const openDay = (cell) => {
        if (!cell.isEmpty && cell.date) {
            setSelectedRule(null);
            setSelectedDate(cell.date);
            setShowCustomModal(true);
        }
    };

    const statusIcon = (status) => {
        switch (status) {
            case "available":
                return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
            case "blocked":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const cellClass = (status, empty) => {
        if (empty) return "bg-gray-50/30";
        const base =
            "border transition-all duration-200 hover:shadow-sm cursor-pointer rounded-lg";
        switch (status) {
            case "available":
                return `${base} bg-emerald-50 hover:bg-emerald-100 border-emerald-200`;
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
                        Configure schedules, manage time slots, and set custom availability rules
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    {[
                        { id: "availability", label: "Availability Calendar", icon: CalIcon },
                        { id: "services", label: "Service Management", icon: Settings },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTopTab(t.id)}
                            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 ${topTab === t.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {topTab === "services" ? (
                <ServiceManagement onServicesUpdated={fetchServices} />
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {/* Service selector */}
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
                            <Dropdown
                                value={selectedService?.id ?? ""}
                                onChange={(id) => {
                                    const svc = services.find((s) => String(s.id) === String(id));
                                    setSelectedService(svc || null);
                                    if (svc) localStorage.setItem("selectedServiceId", svc.id);
                                }}
                                options={services.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                }))}
                                placeholder="Select service..."
                                width="w-52"
                            />
                        </div>
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                            <SummaryBox value={summary.activeDays} label="days with availability" />
                            <SummaryBox value={summary.blockedDays} label="weekdays blocked" />
                            <SummaryBox value={summary.customCount} label="custom dates" />
                            <SummaryBox value={summary.totalSlots} label="total slots this month" />
                        </div>
                    </div>

                    {selectedService && (
                        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 md:gap-6">
                            {/* Panel */}
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
                                    <div className="p-4 md:p-4 space-y-6">
                                        {activeTab === "weekly" && (
                                            <WeeklyRulesPanel
                                                serviceId={selectedService.id}
                                                weeklyRules={rules.filter((r) => !r.date)}
                                            />
                                        )}
                                        {activeTab === "custom" && (
                                            <CustomDatesPanel
                                                serviceId={selectedService.id}
                                                setSelectedDate={setSelectedDate}
                                                setShowCustomModal={setShowCustomModal}
                                                onEditRule={(date, rule) => {
                                                    setSelectedDate(date);
                                                    setSelectedRule(rule);
                                                    setShowCustomModal(true);
                                                }}
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

                                    <div className="p-4">
                                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                                <div
                                                    key={d}
                                                    className="text-center text-xs md:text-sm font-medium text-gray-500"
                                                >
                                                    {d}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 md:gap-1">
                                            {calendarData.map((cell, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => openDay(cell)}
                                                    className={`p-2 w-full min-w-[80px] ${cellClass(
                                                        cell.status,
                                                        cell.isEmpty
                                                    )}`}
                                                    style={{ minHeight: "4.5rem" }}
                                                >
                                                    {!cell.isEmpty && (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs md:text-sm font-medium text-gray-900">
                                                                    {cell.day}
                                                                </span>
                                                                {statusIcon(cell.status)}
                                                            </div>
                                                            <div className="text-[11px] leading-snug space-y-1 break-words">
                                                                {cell.items?.map((it, i) => (
                                                                    <div key={i} className="text-left leading-tight">
                                                                        {it.type === "allday" ? (
                                                                            it.status === "blocked" ? (
                                                                                <div className="text-red-600 font-semibold">Closed</div>
                                                                            ) : (
                                                                                <div className="flex flex-col">
                                                                                    <div className="text-emerald-600 text-[10px] font-medium">
                                                                                        Available
                                                                                    </div>
                                                                                    <div className="font-semibold text-emerald-700 whitespace-nowrap">
                                                                                        {it.start && it.end
                                                                                            ? `${to12h(it.start)} – ${to12h(it.end)}`
                                                                                            : "All Day Available"}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        ) : it.type === "recurring" ? (
                                                                            <>
                                                                                <div className="text-[10px] font-medium whitespace-nowrap">
                                                                                    {it.start && it.end
                                                                                        ? `${to12h(it.start)} – ${to12h(it.end)}`
                                                                                        : "Recurring"}
                                                                                </div>
                                                                                <div className="text-gray-600 whitespace-nowrap">
                                                                                    {it.slots == null
                                                                                        ? `• Every ${it.interval_mins}m available`
                                                                                        : `• ${it.slots} slots`}
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="text-[10px] font-medium whitespace-nowrap">
                                                                                    {to12h(it.time)}
                                                                                </div>
                                                                                <div className="text-emerald-600 whitespace-nowrap">
                                                                                    {it.slots == null
                                                                                        ? "• Available"
                                                                                        : `• ${it.slots} slots`}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="border-t border-gray-200 p-4 md:p-6">
                                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                                            <Legend
                                                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                                label="Available"
                                            />
                                            <Legend
                                                icon={<XCircle className="h-4 w-4 text-red-600" />}
                                                label="Blocked"
                                            />
                                            <Legend
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

            {showCustomModal && selectedService && (
                <CustomDateModal
                    serviceId={selectedService.id}
                    selectedDate={selectedDate}
                    editingRule={selectedRule}
                    open={showCustomModal}
                    onClose={async () => {
                        setShowCustomModal(false);
                        setSelectedRule(null);
                        await fetchRules(selectedService.id);
                    }}
                />
            )}
        </div>
    );
}

function Legend({ icon, label }) {
    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
            <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
            <div className="text-sm font-medium text-gray-900">{label}</div>
        </div>
    );
}

function SummaryBox({ value, label }) {
    return (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
            <span className="font-medium text-gray-900">{value}</span> {label}
        </div>
    );
}
