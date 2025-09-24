// src/components/common/availability/WeeklyRulesPanel.jsx
"use client";

import React, { useState } from "react";
import {
    Trash2,
    Plus,
    Clock,
    Settings,
    X,
    Edit2,
    ChevronDown,
    ChevronUp,
    Calendar,
} from "lucide-react";
import { TIME_OPTIONS, WEEKDAYS } from "@/utils/availabilityUtils";
import Toggle from "@/components/ui/Toggle";
import Modal from "@/components/ui/Modal";

export default function WeeklyRulesPanel({
    weeklyRules = {},
    setWeeklyRules,
    blockedWeekdays = {},
    setBlockedWeekdays,
    customDates = {},
}) {
    const [newTime, setNewTime] = useState("");
    const [newSlots, setNewSlots] = useState("");
    const [editingWeekday, setEditingWeekday] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});

    const [showWarning, setShowWarning] = useState(false);
    const [warningText, setWarningText] = useState("");
    const [pendingBlockDay, setPendingBlockDay] = useState(null);

    const confirmBlockDay = () => {
        if (pendingBlockDay !== null) {
            setBlockedWeekdays((prev) => ({ ...prev, [pendingBlockDay]: true }));
            setPendingBlockDay(null);
        }
        setShowWarning(false);
    };

    const toggleBlockDay = (day) => {
        const hasWeeklySlots = (weeklyRules?.[day] || []).length > 0;
        const hasCustomDates = Object.keys(customDates || {}).some(
            (date) => new Date(date).getDay() === day
        );

        if (!blockedWeekdays[day]) {
            if (hasWeeklySlots && hasCustomDates) {
                setWarningText(
                    "This weekday has both weekly slots and custom date rules. Blocking it will disable weekly slots, but custom dates will still remain."
                );
                setPendingBlockDay(day);
                setShowWarning(true);
                return;
            }
            if (hasWeeklySlots) {
                setWarningText(
                    "This weekday already has weekly slots. Blocking it will disable those slots."
                );
                setPendingBlockDay(day);
                setShowWarning(true);
                return;
            }
            if (hasCustomDates) {
                setWarningText(
                    "This weekday has custom dates. Blocking the weekday will not override specific custom dates."
                );
                setPendingBlockDay(day);
                setShowWarning(true);
                return;
            }
        }

        setBlockedWeekdays((prev) => ({ ...prev, [day]: !prev[day] }));
    };

    const addOrUpdateTimeSlot = (weekday) => {
        const slotsInt = parseInt(newSlots, 10);
        if (!newTime || !slotsInt || slotsInt <= 0) return;

        setWeeklyRules((prev) => {
            let updatedSlots = prev?.[weekday] || [];
            if (editingSlot) {
                updatedSlots = updatedSlots.filter((s) => s.time !== editingSlot);
            }
            updatedSlots = [
                ...updatedSlots,
                { time: newTime, slots: slotsInt },
            ].sort(
                (a, b) =>
                    new Date(`1970-01-01 ${a.time}`) - new Date(`1970-01-01 ${b.time}`)
            );
            return { ...prev, [weekday]: updatedSlots };
        });

        setNewTime("");
        setNewSlots("");
        setEditingSlot(null);
        setEditingWeekday(null);
    };

    const removeTimeSlot = (weekday, timeToRemove) => {
        setWeeklyRules((prev) => ({
            ...prev,
            [weekday]: (prev?.[weekday] || []).filter(
                (slot) => slot.time !== timeToRemove
            ),
        }));
        if (editingSlot === timeToRemove) {
            setEditingSlot(null);
            setNewTime("");
            setNewSlots("");
        }
    };

    const handleEditSlot = (slot) => {
        setNewTime(slot.time);
        setNewSlots(slot.slots);
        setEditingSlot(slot.time);
    };

    const getTotalSlots = (weekday) => {
        const slots = weeklyRules?.[weekday] || [];
        return slots.reduce((sum, slot) => sum + slot.slots, 0);
    };

    const getCustomDateCount = (weekday) => {
        return Object.keys(customDates || {}).filter(
            (date) => new Date(date).getDay() === weekday
        ).length;
    };

    const toggleDayExpand = (day) => {
        setExpandedDays((prev) => ({ ...prev, [day]: !prev[day] }));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    Weekly Schedule Rules
                </h3>
            </div>

            {/* Days */}
            <div className="space-y-2">
                {WEEKDAYS.map(({ value, label }) => {
                    const isBlocked = blockedWeekdays?.[value] || false;
                    const slots = weeklyRules?.[value] || [];
                    const customDateCount = getCustomDateCount(value);
                    const totalSlots = getTotalSlots(value);
                    const expanded = expandedDays[value];

                    return (
                        <div
                            key={value}
                            className="bg-white border border-gray-200 rounded-lg p-3"
                        >
                            {/* Day header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {label}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {!isBlocked && slots.length > 0 && (
                                                <span>{totalSlots} slots </span>
                                            )}
                                            {customDateCount > 0 && (
                                                <span>• {customDateCount} custom dates</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleDayExpand(value)}
                                        className="p-1.5 hover:bg-gray-100 rounded"
                                        title={expanded ? "Collapse" : "Expand"}
                                    >
                                        {expanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-500" />
                                        )}
                                    </button>
                                    <Toggle
                                        checked={isBlocked}
                                        onChange={() => toggleBlockDay(value)}
                                        className={isBlocked ? "bg-red-600" : ""}
                                    />
                                </div>
                            </div>

                            {/* Expanded content */}
                            {expanded && (
                                <div className="mt-3 space-y-2">
                                    {isBlocked ? (
                                        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 flex items-center gap-2">
                                            <X className="h-4 w-4" />
                                            <span>All {label}s are blocked</span>
                                        </div>
                                    ) : (
                                        <>
                                            {slots.length > 0 ? (
                                                <div className="space-y-1">
                                                    {slots.map((slot, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between bg-gray-50 rounded px-2 py-1.5 text-sm"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                                                <span className="font-mono font-medium">
                                                                    {slot.time}
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    • {slot.slots}{" "}
                                                                    {slot.slots === 1 ? "slot" : "slots"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleEditSlot(slot)}
                                                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                    title="Edit slot"
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        removeTimeSlot(value, slot.time)
                                                                    }
                                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                                    title="Remove slot"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm font-medium">
                                                        No weekly schedule set
                                                    </p>
                                                    <p className="text-xs">
                                                        Add time slots to create a recurring schedule
                                                    </p>
                                                </div>
                                            )}

                                            {/* Add/Edit form */}
                                            {editingWeekday === value ? (
                                                <div className="border rounded p-2 bg-blue-50 space-y-2">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <select
                                                            value={newTime}
                                                            onChange={(e) => setNewTime(e.target.value)}
                                                            className="col-span-2 border rounded px-2 py-1 text-sm"
                                                        >
                                                            <option value="">Time...</option>
                                                            {TIME_OPTIONS.map((time) => (
                                                                <option key={time} value={time}>
                                                                    {time}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            value={newSlots}
                                                            onChange={(e) => setNewSlots(e.target.value)}
                                                            placeholder="Slots"
                                                            className="border rounded px-2 py-1 text-sm"
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingWeekday(null);
                                                                setEditingSlot(null);
                                                                setNewTime("");
                                                                setNewSlots("");
                                                            }}
                                                            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => addOrUpdateTimeSlot(value)}
                                                            disabled={
                                                                !newTime ||
                                                                !newSlots ||
                                                                parseInt(newSlots, 10) <= 0
                                                            }
                                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                                        >
                                                            {editingSlot ? "Update" : "Add"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingWeekday(value)}
                                                    className="w-full text-xs text-blue-600 hover:bg-blue-50 rounded py-1.5 font-medium"
                                                >
                                                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                                                    Add Time Slot
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Warning Modal */}
            <Modal
                open={showWarning}
                onClose={() => setShowWarning(false)}
                title="Confirm Block Action"
            >
                <p className="text-sm text-red-600 mb-4">{warningText}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowWarning(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmBlockDay}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Continue
                    </button>
                </div>
            </Modal>
        </div>
    );
}
