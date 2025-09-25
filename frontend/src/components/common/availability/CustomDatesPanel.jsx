// src/components/common/availability/CustomDatesPanel.jsx
import React from "react";
import { Plus, Trash2, Edit3, Calendar, Clock, X } from "lucide-react";

export default function CustomDatesPanel({
    customDates = {},
    setCustomDates,
    setSelectedDate,
    setShowCustomModal,
}) {
    const removeCustomDate = (dateStr) => {
        setCustomDates((prev) => {
            const updated = { ...prev };
            delete updated[dateStr];
            return updated;
        });
    };

    const safeDates = Object.entries(customDates || {}).sort(([a], [b]) =>
        new Date(a).getTime() - new Date(b).getTime()
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getTotalSlots = (times = []) => {
        return times.reduce((sum, slot) => sum + slot.slots, 0);
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

            {/* Custom Dates List */}
            <div className="space-y-3 max-h-100 overflow-y-auto pr-2">
                {safeDates.map(([dateStr, entry]) => (
                    <div
                        key={dateStr}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                        {/* Date Header */}
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {formatDate(dateStr)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(dateStr) < new Date()
                                            ? "Past date"
                                            : "Upcoming"}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        setShowCustomModal(true);
                                    }}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit custom date"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => removeCustomDate(dateStr)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove custom date"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Status Content */}
                        {entry?.status === "blocked" ? (
                            <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 rounded-lg px-3 py-2 border border-red-200">
                                <X className="h-4 w-4" />
                                <span className="font-medium">
                                    Blocked – No appointments available
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        Time Slots
                                    </span>
                                    {entry?.times?.length > 0 && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {getTotalSlots(entry.times)} total slots
                                        </span>
                                    )}
                                </div>

                                {(entry?.times || []).length > 0 ? (
                                    <div className="grid grid-cols-1 gap-1">
                                        {entry.times.map((slot, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2"
                                            >
                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                <span className="font-mono font-medium">
                                                    {slot.time}
                                                </span>
                                                <span className="text-gray-600">•</span>
                                                <span className="text-gray-700">
                                                    {slot.slots} {slot.slots === 1 ? "slot" : "slots"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                                        No time slots configured
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {safeDates.length === 0 && (
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

            {safeDates.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 text-center">
                    {safeDates.length} custom{" "}
                    {safeDates.length === 1 ? "date" : "dates"} configured
                </div>
            )}
        </div>
    );
}
