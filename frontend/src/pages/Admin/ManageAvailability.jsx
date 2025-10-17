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
import api from "@/api/api";

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

    /* -------- Fetch services -------- */
    const fetchServices = useCallback(async () => {
        try {
            const res = await api.get("/admin/services");
            if (res.data.success) {
                const active = res.data.services.filter((s) => s.active);
                setServices(active);
                if (active.length > 0 && !selectedService) {
                    setSelectedService(active[0]);
                }
            }
        } catch (e) {
            console.error("❌ services", e);
        }
    }, [selectedService]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    /* -------- Fetch rules when service changes -------- */
    useEffect(() => {
        if (selectedService?.id) {
            fetchRules(selectedService.id);
        }
    }, [selectedService, fetchRules]);

    /* -------- Calendar generation (weekly + custom merge + cutoff) -------- */
    const calendarData = useMemo(() => {
        if (!selectedService) return [];

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const dim = getDaysInMonth(year, month);
        const first = getFirstDayOfMonth(year, month);

        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Compute cutoff date
        const cutoffDays = selectedService.cutoff_days || 0;
        const cutoffDate = new Date(todayOnly);
        cutoffDate.setDate(todayOnly.getDate() + cutoffDays);

        const days = [];

        const normalizeRule = (rule, dow) => {
            if (!rule) return null;
            if (rule.type === "single") {
                return { type: "single", time: rule.time?.slice(0, 5) || null, slots: rule.slots, status: rule.status };
            }
            if (rule.type === "recurring") {
                return { type: "recurring", start: rule.start, end: rule.end, interval_mins: rule.interval_mins, slots: rule.slots, status: rule.status };
            }
            if (rule.type === "allday") {
                const hours = churchHours?.[dow];
                const start = rule.start || hours?.open_time || null;
                const end = rule.end || hours?.close_time || null;
                return { type: "allday", start, end, slots: rule.slots, status: rule.status };
            }
            return null;
        };

        // Empty days for offset
        for (let i = 0; i < first; i++) days.push({ isEmpty: true });

        for (let d = 1; d <= dim; d++) {
            const date = new Date(year, month, d);
            const iso = formatDate(date);
            const dow = date.getDay();

            let status = "neutral";
            let items = [];

            const weekly = rules.filter((r) => r.weekday === dow && !r.date);
            const custom = rules.filter((r) => formatDate(r.date) === iso);

            const weeklyNorm = weekly.map((r) => normalizeRule(r, dow)).filter(Boolean);
            const customNorm = custom.map((r) => normalizeRule(r, dow)).filter(Boolean);

            // Hide past date only if no schedule exists
            if (date < todayOnly && weeklyNorm.length === 0 && customNorm.length === 0) {
                days.push({ isEmpty: false, day: d, date: iso, status: "none", items: [] });
                continue;
            }

            const weeklyBlocked = weeklyNorm.some((r) => r.type === "allday" && r.status === "blocked");
            const customBlocked = customNorm.some((r) => r.type === "allday" && r.status === "blocked");

            const weeklyAllDayAvail = weeklyNorm.find((r) => r.type === "allday" && r.status === "available");
            const customAllDayAvail = customNorm.find((r) => r.type === "allday" && r.status === "available");

            // Priority rules
            if (customBlocked || weeklyBlocked) {
                status = "blocked";
                items = [{ type: "allday", status: "blocked" }];
            } else if (customAllDayAvail || weeklyAllDayAvail) {
                status = "available";
                const chosen = customAllDayAvail || weeklyAllDayAvail;
                items = [{ type: "allday", status: "available", start: chosen.start || null, end: chosen.end || null }];
            } else {
                const additive = [...weeklyNorm.filter((r) => r.type !== "allday"), ...customNorm.filter((r) => r.type !== "allday")];
                if (additive.length > 0) {
                    status = "available";
                    items = additive;
                }
            }

            days.push({ isEmpty: false, day: d, date: iso, status, items });
        }

        return days;
    }, [viewDate, rules, churchHours, selectedService]);




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
        if (!cell.isEmpty && cell.date && cell.status !== "none") {
            setSelectedRule(null);
            setSelectedDate(cell.date);
            setShowCustomModal(true);
        }
    };
    const statusIcon = (status) => {
        switch (status) {
            case "available":
                return <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />;
            case "blocked":
                return <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />;
            default:
                return <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />;
        }
    };

    const cellClass = (status, empty) => {
        if (empty) return "bg-gray-50/30";
        const base =
            "border transition-all duration-200 hover:shadow-sm cursor-pointer rounded-md md:rounded-lg";
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
        <div className="w-full mx-auto space-y-3 md:space-y-6 px-2 md:px-0">
            {/* Header */}
            <div className="flex flex-col gap-2 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold text-slate-900">
                        Service Availability Management
                    </h1>
                    <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-gray-500">
                        Configure schedules, manage time slots, and set custom availability rules
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-4 md:space-x-6 min-w-max">
                    {[
                        { id: "availability", label: "Availability Calendar", icon: CalIcon },
                        { id: "services", label: "Service Management", icon: Settings },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTopTab(t.id)}
                            className={`flex items-center gap-1.5 md:gap-2 px-1 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${topTab === t.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <t.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {topTab === "services" ? (
                <ServiceManagement onServicesUpdated={fetchServices} />
            ) : (
                <div className="space-y-3 md:space-y-6">
                    {/* Service selector */}
                    <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-3 md:p-6 space-y-3 md:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-0.5 md:mb-1">
                                    Select Service
                                </h3>
                                <p className="text-xs md:text-sm text-gray-600">
                                    Choose a service to configure its availability
                                </p>
                            </div>
                            <Dropdown
                                value={selectedService?.id ?? ""}
                                onChange={(id) => {
                                    const svc = services.find((s) => s.id === id);
                                    setSelectedService(svc || null);
                                }}
                                options={services.map((s) => ({
                                    value: s.id,
                                    label: s.name,
                                }))}
                                placeholder="Select service..."
                                width="w-full sm:w-52"
                            />
                        </div>
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-[10px] md:text-xs text-gray-600">
                            <SummaryBox value={summary.activeDays} label="days with availability" />
                            <SummaryBox value={summary.blockedDays} label="weekdays blocked" />
                            <SummaryBox value={summary.customCount} label="custom dates" />
                            <SummaryBox value={summary.totalSlots} label="total slots this month" />
                        </div>
                    </div>

                    {selectedService && (
                        <div className="grid grid-cols-1 xl:grid-cols-6 gap-3 md:gap-6">
                            {/* Panel */}
                            <div className="xl:col-span-2">
                                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200">
                                    <div className="border-b border-gray-200 flex">
                                        <button
                                            onClick={() => setActiveTab("weekly")}
                                            className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 ${activeTab === "weekly"
                                                ? "border-blue-500 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Weekly Rules
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("custom")}
                                            className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-b-2 ${activeTab === "custom"
                                                ? "border-blue-500 text-blue-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            Custom Dates
                                        </button>
                                    </div>
                                    <div className="p-3 md:p-4 space-y-4 md:space-y-6">
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
                                <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 md:p-6 border-b border-gray-200">
                                        <h2 className="text-sm md:text-lg font-semibold text-gray-900">
                                            {selectedService.name} Schedule
                                        </h2>
                                        <div className="flex items-center bg-white rounded-md md:rounded-lg border border-gray-200">
                                            <button
                                                onClick={handlePrevMonth}
                                                className="p-1.5 md:p-2 hover:bg-gray-50 rounded-l-md md:rounded-l-lg"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
                                            </button>
                                            <div className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-gray-900 min-w-[120px] md:min-w-[140px] text-center border-x border-gray-200">
                                                {viewDate.toLocaleDateString("en-US", {
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            <button
                                                onClick={handleNextMonth}
                                                className="p-1.5 md:p-2 hover:bg-gray-50 rounded-r-md md:rounded-r-lg"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-2 md:p-4 overflow-x-auto">
                                        <div className="min-w-[280px]">
                                            <div className="grid grid-cols-7 gap-0.5 md:gap-2 mb-1 md:mb-2">
                                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                                    <div
                                                        key={d}
                                                        className="text-center text-[10px] md:text-sm font-medium text-gray-500 py-1"
                                                    >
                                                        <span className="hidden sm:inline">{d}</span>
                                                        <span className="sm:hidden">{d.charAt(0)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                                                {calendarData.map((cell, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => openDay(cell)}
                                                        className={`p-1 md:p-2 w-full ${cellClass(
                                                            cell.status,
                                                            cell.isEmpty
                                                        )}`}
                                                        style={{ minHeight: "3rem", maxHeight: "5rem" }}
                                                    >
                                                        {!cell.isEmpty && (
                                                            <div className="flex flex-col h-full overflow-hidden">
                                                                <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                                                    <span className="text-[10px] md:text-sm font-medium text-gray-900">
                                                                        {cell.day}
                                                                    </span>
                                                                    {statusIcon(cell.status)}
                                                                </div>
                                                                <div className="text-[9px] md:text-[11px] leading-tight space-y-0.5 break-words overflow-hidden">
                                                                    {cell.items?.slice(0, 2).map((it, i) => (
                                                                        <div key={i} className="text-left leading-tight truncate">
                                                                            {it.type === "allday" ? (
                                                                                it.status === "blocked" ? (
                                                                                    <div className="text-red-600 font-semibold">Closed</div>
                                                                                ) : (
                                                                                    <div className="flex flex-col">
                                                                                        <div className="text-emerald-600 text-[8px] md:text-[10px] font-medium">
                                                                                            Available
                                                                                        </div>
                                                                                        <div className="font-semibold text-emerald-700 whitespace-nowrap truncate">
                                                                                            {it.start && it.end
                                                                                                ? `${to12h(it.start)} – ${to12h(it.end)}`
                                                                                                : "All Day"}
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            ) : it.type === "recurring" ? (
                                                                                <>
                                                                                    <div className="text-[8px] md:text-[10px] font-medium truncate">
                                                                                        {it.start && it.end
                                                                                            ? `${to12h(it.start)} – ${to12h(it.end)}`
                                                                                            : "Recurring"}
                                                                                    </div>
                                                                                    <div className="text-gray-600 truncate">
                                                                                        {it.slots == null
                                                                                            ? `• Every ${it.interval_mins}m`
                                                                                            : `• ${it.slots} slots`}
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="text-[8px] md:text-[10px] font-medium truncate">
                                                                                        {to12h(it.time)}
                                                                                    </div>
                                                                                    <div className="text-emerald-600 truncate">
                                                                                        {it.slots == null ? "• Available" : `• ${it.slots} slots`}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {cell.items && cell.items.length > 2 && (
                                                                        <div className="text-[8px] md:text-[9px] text-gray-500">
                                                                            +{cell.items.length - 2} more
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="border-t border-gray-200 p-3 md:p-6">
                                        <div className="grid grid-cols-3 gap-2 md:gap-4">
                                            <Legend
                                                icon={<CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />}
                                                label="Available"
                                            />
                                            <Legend
                                                icon={<XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />}
                                                label="Blocked"
                                            />
                                            <Legend
                                                icon={<AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />}
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
        <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-white rounded-md md:rounded-lg border border-gray-100">
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">{icon}</div>
            <div className="text-[10px] md:text-sm font-medium text-gray-900">{label}</div>
        </div>
    );
}

function SummaryBox({ value, label }) {
    return (
        <div className="bg-gray-50 rounded-md md:rounded-lg px-2 md:px-3 py-1.5 md:py-2">
            <span className="font-medium text-gray-900">{value}</span>{" "}
            <span className="text-[10px] md:text-xs">{label}</span>
        </div>
    );
}