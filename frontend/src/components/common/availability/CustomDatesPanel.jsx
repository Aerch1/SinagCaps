import React, { useMemo } from "react";
import { Plus, Trash2, Edit3, Calendar, Clock, X } from "lucide-react";
import { to12h, formatDate } from "@/utils/availabilityUtils";
import { useAdminAvailabilityStore } from "../../../store/adminAvailabilityStore.js";
import useChurchHours from "@/hooks/useChurchHours";

export default function CustomDatesPanel({
    serviceId,
    setSelectedDate,
    setShowCustomModal,
    onEditRule,
}) {
    const { rules, deleteRule, fetchRules } = useAdminAvailabilityStore();
    const { churchHours } = useChurchHours();

    // Group rules by date
    const groupedByDate = useMemo(() => {
        const map = {};
        (rules || [])
            .filter((r) => r.date)
            .forEach((r) => {
                const key = formatDate(r.date);
                if (!map[key]) map[key] = [];
                map[key].push(r);
            });
        return Object.entries(map)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([date, rules]) => ({ date, rules }));
    }, [rules]);

    const formatDisplayDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const handleDelete = async (id) => {
        await deleteRule(id);
        await fetchRules(serviceId);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">
                        Custom Date Settings
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                        Manage availability for specific dates
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedDate(new Date().toISOString().split("T")[0]);
                        setShowCustomModal(true);
                    }}
                    className="inline-flex items-center justify-center bg-secondary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
                    title="Add Custom Date"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Add</span>
                </button>
            </div>

            {/* Dates list */}
            <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
                {groupedByDate.map(({ date, rules }) => {
                    const blockedRule = rules.find(
                        (r) => r.type === "allday" && r.status === "blocked"
                    );
                    const isBlocked = Boolean(blockedRule);

                    const dow = new Date(date).getDay();
                    const hours = churchHours?.[dow];

                    return (
                        <div
                            key={date}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                        >
                            {/* Date header */}
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {formatDisplayDate(date)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(date) < new Date() ? "Past date" : "Upcoming"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rules */}
                            {isBlocked ? (
                                <div className="flex items-center gap-2 justify-between text-sm bg-red-50 text-red-700 rounded-lg px-3 py-2 border border-red-200">
                                    <div className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        <span className="font-medium">
                                            Blocked – No appointments available
                                        </span>
                                    </div>
                                    {blockedRule && (
                                        <button
                                            onClick={() => handleDelete(blockedRule.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                {rule.type === "allday" && (
                                                    <span className="font-medium text-emerald-700">
                                                        {to12h(rule.start || hours?.open_time)} –{" "}
                                                        {to12h(rule.end || hours?.close_time)} • Available
                                                    </span>
                                                )}
                                                {rule.type === "single" && (
                                                    <>
                                                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                        <span className="font-mono font-medium">
                                                            {to12h(rule.time)}
                                                        </span>
                                                        <span className="text-gray-600">•</span>
                                                        <span className="text-gray-700">
                                                            {rule.slots == null
                                                                ? "Available"
                                                                : `${rule.slots} slot${rule.slots === 1 ? "" : "s"}`}
                                                        </span>
                                                    </>
                                                )}
                                                {rule.type === "recurring" && (
                                                    <span className="text-gray-700">
                                                        {to12h(rule.start)} – {to12h(rule.end)} every{" "}
                                                        {rule.interval_mins}m •{" "}
                                                        {rule.slots == null
                                                            ? "Available"
                                                            : `${rule.slots} slots`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onEditRule?.(date, rule)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {groupedByDate.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                            No Custom Dates
                        </h4>
                        <p className="text-sm mb-4">
                            Create custom schedules for specific dates or block unavailable
                            periods
                        </p>
                        <button
                            onClick={() => {
                                setSelectedDate(new Date().toISOString().split("T")[0]);
                                setShowCustomModal(true);
                            }}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Your First Custom Date
                        </button>
                    </div>
                )}
            </div>

            {groupedByDate.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 text-center">
                    {groupedByDate.length} custom{" "}
                    {groupedByDate.length === 1 ? "date" : "dates"} configured
                </div>
            )}
        </div>
    );
}
