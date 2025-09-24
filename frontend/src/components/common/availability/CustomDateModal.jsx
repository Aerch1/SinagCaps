// src/components/common/availability/CustomDateModal.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import { TIME_OPTIONS, formatDate, parseDate } from "@/utils/availabilityUtils";
import Modal from "../../ui/Modal"; // ✅ import your modal wrapper

export default function CustomDateModal({
    selectedDate,
    customDates,
    setCustomDates,
    blockedWeekdays = {},
    onClose,
}) {
    const [mode, setMode] = useState("custom");
    const [customTimes, setCustomTimes] = useState([]);
    const [newTime, setNewTime] = useState("");
    const [newSlots, setNewSlots] = useState("");
    const [editingTime, setEditingTime] = useState(null);

    const [startDate, setStartDate] = useState(selectedDate || "");
    const [endDate, setEndDate] = useState(selectedDate || "");
    const [showWarning, setShowWarning] = useState(false);
    const [warningText, setWarningText] = useState("");

    // --- Load existing data ---
    useEffect(() => {
        if (selectedDate && customDates[selectedDate]) {
            const custom = customDates[selectedDate];
            if (custom.status === "blocked") {
                setMode("blocked");
                setCustomTimes([]);
            } else {
                setMode("custom");
                setCustomTimes(custom.times || []);
            }
        } else {
            setMode("custom");
            setCustomTimes([]);
        }
    }, [selectedDate, customDates]);

    // --- Slot management ---
    const addTimeSlot = () => {
        const slotsInt = parseInt(newSlots, 10);
        if (!newTime || !slotsInt || slotsInt <= 0) return;

        let updated = [...customTimes];

        if (editingTime) {
            updated = updated.filter((slot) => slot.time !== editingTime);
        }

        updated.push({ time: newTime, slots: slotsInt });
        updated.sort(
            (a, b) =>
                new Date(`1970-01-01 ${a.time}`) - new Date(`1970-01-01 ${b.time}`)
        );

        setCustomTimes(updated);
        setNewTime("");
        setNewSlots("");
        setEditingTime(null);
    };

    const removeTimeSlot = (timeToRemove) => {
        setCustomTimes((prev) => prev.filter((slot) => slot.time !== timeToRemove));
        if (editingTime === timeToRemove) {
            setNewTime("");
            setNewSlots("");
            setEditingTime(null);
        }
    };

    const handleEdit = (slot) => {
        setNewTime(slot.time);
        setNewSlots(slot.slots);
        setEditingTime(slot.time);
    };

    // --- Save handling ---
    const handleSave = () => {
        const rangeStart = parseDate(startDate);
        const dow = rangeStart.getDay();

        if (mode === "custom") {
            if (blockedWeekdays[dow]) {
                setWarningText(
                    "⚠️ This day is normally blocked in Weekly Rules. Adding slots will override it. Continue?"
                );
                setShowWarning(true);
                return;
            }
            if (customDates[startDate]?.status === "blocked") {
                setWarningText(
                    "⚠️ This date is blocked. Adding slots will re-enable it. Continue?"
                );
                setShowWarning(true);
                return;
            }
        }

        if (mode === "blocked" && customDates[startDate]?.times?.length > 0) {
            setWarningText(
                "⚠️ This date already has custom slots. Blocking will remove them. Continue?"
            );
            setShowWarning(true);
            return;
        }

        applySave();
    };

    const applySave = () => {
        let updates = {};
        const rangeStart = parseDate(startDate);
        const rangeEnd = parseDate(endDate);

        for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
            const iso = formatDate(d);
            updates[iso] =
                mode === "blocked"
                    ? { status: "blocked" }
                    : { times: customTimes, status: "available" };
        }

        setCustomDates((prev) => ({ ...prev, ...updates }));
        onClose();
    };

    const isInvalidRange =
        !startDate || !endDate || parseDate(startDate) > parseDate(endDate);

    return (
        <>
            {/* Main Modal */}
            <Modal open={true} onClose={onClose} title="Custom Date Setup" className="max-w-lg">
                {/* Date Range */}
                <div className="flex items-center gap-3 mb-6">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                </div>

                {/* Mode buttons */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setMode("custom")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${mode === "custom"
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Add Slots
                    </button>
                    <button
                        onClick={() => setMode("blocked")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${mode === "blocked"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Block Dates
                    </button>
                </div>

                {/* Slots Section */}
                {mode === "custom" && (
                    <div>
                        <p className="text-sm text-gray-700 font-medium mb-3">Time Slots</p>
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                            {customTimes.map((slot, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                                >
                                    <span>
                                        {slot.time} • {slot.slots} slots
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(slot)}
                                            className="text-blue-500 hover:text-blue-700 text-xs"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => removeTimeSlot(slot.time)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {customTimes.length === 0 && (
                                <p className="text-xs text-gray-500">No time slots added yet</p>
                            )}
                        </div>

                        <div className="flex gap-3 items-center">
                            <select
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Select time...</option>
                                {TIME_OPTIONS.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                placeholder="Slots"
                                value={newSlots}
                                onChange={(e) => setNewSlots(e.target.value)}
                                className="w-24 border rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                onClick={addTimeSlot}
                                disabled={!newTime || !newSlots || parseInt(newSlots, 10) <= 0}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {editingTime ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                )}

                {mode === "blocked" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-700">
                        The selected date(s) will be completely unavailable. Existing slots will be removed.
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isInvalidRange}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>
            </Modal>

            {/* Warning Modal */}
            <Modal open={showWarning} onClose={() => setShowWarning(false)} title="Confirm Action">
                <p className="text-sm text-red-600 mb-4">{warningText}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowWarning(false)}
                        className="px-4 py-2 text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            setShowWarning(false);
                            applySave();
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Continue
                    </button>
                </div>
            </Modal>
        </>
    );
}
