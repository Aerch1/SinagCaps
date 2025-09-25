"use client";

import React, { useMemo, useState } from "react";
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
    AlertTriangle,
} from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import Modal from "@/components/ui/Modal";

/* ---------------- Helpers ---------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const toMinutes = (t) => {
    const [h, m] = (t || "00:00").split(":").map((v) => parseInt(v, 10));
    return h * 60 + m;
};
const diffMinutes = (start, end) => Math.max(0, toMinutes(end) - toMinutes(start));
const occurrencesBetween = (start, end, everyMins) => {
    if (!start || !end || !everyMins) return 0;
    const total = diffMinutes(start, end);
    return total <= 0 ? 0 : Math.floor(total / everyMins);
};
const fmt12 = (hhmm) => {
    try {
        const d = new Date(`1970-01-01T${hhmm}:00`);
        return d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return hhmm || "—";
    }
};

const WEEKDAYS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
    const mins = i * 30;
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${pad2(hh)}:${pad2(mm)}`;
});

export default function WeeklyRulesPanel({
    weeklyRules = {},
    setWeeklyRules,
    blockedWeekdays = {},
    setBlockedWeekdays,
    workingHours = { start: "08:00", end: "17:00" },
}) {
    /* UI state */
    const [expandedDays, setExpandedDays] = useState({});
    const [editingForDay, setEditingForDay] = useState(null);
    const [editIndex, setEditIndex] = useState(null);

    const [mode, setMode] = useState("single");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [every, setEvery] = useState(30);

    const [showOverride, setShowOverride] = useState(false);
    const [pendingAllDayDay, setPendingAllDayDay] = useState(null);

    const resetEditor = () => {
        setMode("single");
        setTime("");
        setSlots("");
        setStart("");
        setEnd("");
        setEvery(30);
        setEditingForDay(null);
        setEditIndex(null);
    };

    const toggleExpand = (day) =>
        setExpandedDays((p) => ({ ...p, [day]: !p[day] }));

    /* Save */
    const saveRule = (weekday) => {
        if (mode === "allday") {
            const hasExisting = (weeklyRules[weekday] || []).length > 0;
            if (hasExisting && editIndex == null) {
                setPendingAllDayDay(weekday);
                setShowOverride(true);
                return;
            }
            applyAllDay(weekday, true);
            return;
        }

        if (mode === "single") {
            if (!time) return;
            const parsedSlots =
                slots === "" ? null : Math.max(0, parseInt(slots, 10) || 0);
            const entry = { type: "single", time, slots: parsedSlots };
            insertOrUpdate(weekday, entry);
            return;
        }

        if (mode === "recurring") {
            if (!start || !end) return;
            const occ = occurrencesBetween(start, end, Number(every));
            const parsedSlots =
                slots === "" ? null : Math.max(0, parseInt(slots, 10) || 0);
            const finalSlots =
                parsedSlots != null && parsedSlots > occ ? occ : parsedSlots;

            const entry = {
                type: "recurring",
                start,
                end,
                interval: Number(every),
                slots: finalSlots,
            };
            insertOrUpdate(weekday, entry);
        }
    };

    const insertOrUpdate = (weekday, entry) => {
        setWeeklyRules((prev) => {
            const list = [...(prev[weekday] || [])];
            if (editIndex != null) {
                list[editIndex] = entry;
            } else {
                list.push(entry);
            }
            return { ...prev, [weekday]: list };
        });
        resetEditor();
    };

    const applyAllDay = (weekday) => {
        setWeeklyRules((prev) => ({
            ...prev,
            [weekday]: [
                { type: "allday", start: workingHours.start, end: workingHours.end },
            ],
        }));
        setShowOverride(false);
        setPendingAllDayDay(null);
        resetEditor();
    };

    const removeRule = (weekday, idx) => {
        setWeeklyRules((prev) => {
            const list = [...(prev[weekday] || [])];
            list.splice(idx, 1);
            return { ...prev, [weekday]: list };
        });
        if (editIndex === idx) resetEditor();
    };

    const editRule = (weekday, idx, rule) => {
        setEditingForDay(weekday);
        setEditIndex(idx);
        if (rule.type === "allday") {
            setMode("allday");
            return;
        }
        if (rule.type === "recurring") {
            setMode("recurring");
            setStart(rule.start || "");
            setEnd(rule.end || "");
            setEvery(rule.interval || 30);
            setSlots(rule.slots == null ? "" : String(rule.slots));
            return;
        }
        setMode("single");
        setTime(rule.time || "");
        setSlots(rule.slots == null ? "" : String(rule.slots));
    };

    /* Info for recurring */
    const occInfo = useMemo(() => {
        if (mode !== "recurring" || !start || !end || !every)
            return { occ: 0, warn: "" };
        const occ = occurrencesBetween(start, end, Number(every));
        let warn = "";
        const typed = slots === "" ? null : parseInt(slots, 10) || 0;
        if (typed != null && typed > occ) {
            warn = `Only ${occ} occurrences fit between ${fmt12(start)} and ${fmt12(
                end
            )} every ${every} mins. Clamped.`;
        }
        return { occ, warn };
    }, [mode, start, end, every, slots]);

    const toggleBlockDay = (day) =>
        setBlockedWeekdays((p) => ({ ...p, [day]: !p[day] }));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    Weekly Schedule Rules
                </h3>
            </div>

            <div className="space-y-2">
                {WEEKDAYS.map(({ value, label }) => {
                    const isBlocked = blockedWeekdays?.[value] || false;
                    const rules = weeklyRules?.[value] || [];
                    const expanded = expandedDays[value];
                    const hasAllDay = rules.some((r) => r.type === "allday");

                    return (
                        <div
                            key={value}
                            className="bg-white border border-gray-200 rounded-lg"
                        >
                            <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {label}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {isBlocked ? "Blocked" : rules.length ? "Has rules" : "Available"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleExpand(value)}
                                        className="p-1.5 hover:bg-gray-100 rounded"
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

                            {expanded && (
                                <div className="px-3 pb-3 space-y-2">
                                    {isBlocked ? (
                                        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 flex items-center gap-2">
                                            <X className="h-4 w-4" />
                                            {label} is blocked
                                        </div>
                                    ) : (
                                        <>
                                            {/* Rules list */}
                                            {rules.map((rule, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start justify-between bg-gray-50 px-3 py-2 rounded border"
                                                >
                                                    <div className="text-sm">
                                                        {rule.type === "allday" ? (
                                                            <>
                                                                <div className="font-semibold text-emerald-700">
                                                                    All Day
                                                                </div>
                                                                <div className="text-xs text-gray-700">
                                                                    {fmt12(rule.start)} – {fmt12(rule.end)}
                                                                </div>
                                                            </>
                                                        ) : rule.type === "recurring" ? (
                                                            <>
                                                                <div className="font-mono font-medium">
                                                                    {fmt12(rule.start)} – {fmt12(rule.end)}
                                                                </div>
                                                                <div className="text-xs text-gray-700">
                                                                    • Every {rule.interval} mins{" "}
                                                                    {rule.slots == null
                                                                        ? "• Available"
                                                                        : `• Slots each: ${rule.slots}`}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-mono font-medium">
                                                                    {fmt12(rule.time)}
                                                                </div>
                                                                <div className="text-xs text-gray-700">
                                                                    {rule.slots == null
                                                                        ? "• Available"
                                                                        : `• ${rule.slots} slots`}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => editRule(value, idx, rule)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeRule(value, idx)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Editor */}
                                            {editingForDay === value && (
                                                <div className="mt-2 border rounded bg-blue-50 p-3 space-y-2">
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                checked={mode === "single"}
                                                                onChange={() => setMode("single")}
                                                            />{" "}
                                                            Single Slot
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                checked={mode === "recurring"}
                                                                onChange={() => setMode("recurring")}
                                                            />{" "}
                                                            Recurring
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                checked={mode === "allday"}
                                                                onChange={() => setMode("allday")}
                                                            />{" "}
                                                            All Day
                                                        </label>
                                                    </div>

                                                    {mode === "single" && (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <select
                                                                value={time}
                                                                onChange={(e) => setTime(e.target.value)}
                                                                className="col-span-2 border rounded px-2 py-1 text-sm bg-white"
                                                            >
                                                                <option value="">Time…</option>
                                                                {TIME_OPTIONS.map((t) => (
                                                                    <option key={t} value={t}>
                                                                        {fmt12(t)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                value={slots}
                                                                onChange={(e) => setSlots(e.target.value)}
                                                                placeholder="Slots (optional)"
                                                                className="border rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>
                                                    )}

                                                    {mode === "recurring" && (
                                                        <>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <select
                                                                    value={start}
                                                                    onChange={(e) => setStart(e.target.value)}
                                                                    className="border rounded px-2 py-1 text-sm bg-white"
                                                                >
                                                                    <option value="">Start…</option>
                                                                    {TIME_OPTIONS.map((t) => (
                                                                        <option key={t} value={t}>
                                                                            {fmt12(t)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    value={end}
                                                                    onChange={(e) => setEnd(e.target.value)}
                                                                    className="border rounded px-2 py-1 text-sm bg-white"
                                                                >
                                                                    <option value="">End…</option>
                                                                    {TIME_OPTIONS.map((t) => (
                                                                        <option key={t} value={t}>
                                                                            {fmt12(t)}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <select
                                                                    value={every}
                                                                    onChange={(e) =>
                                                                        setEvery(parseInt(e.target.value, 10))
                                                                    }
                                                                    className="border rounded px-2 py-1 text-sm bg-white"
                                                                >
                                                                    {[15, 30, 60].map((n) => (
                                                                        <option key={n} value={n}>
                                                                            Every {n} mins
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    value={slots}
                                                                    onChange={(e) => setSlots(e.target.value)}
                                                                    placeholder="Slots each (optional)"
                                                                    className="border rounded px-2 py-1 text-sm"
                                                                />
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                Possible occurrences:{" "}
                                                                <span className="font-medium">{occInfo.occ}</span>
                                                                {occInfo.warn && (
                                                                    <span className="ml-2 text-amber-700 inline-flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        {occInfo.warn}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {mode === "allday" && (
                                                        <div className="text-sm text-gray-800">
                                                            {fmt12(workingHours.start)} – {fmt12(workingHours.end)}
                                                            <div className="text-xs text-gray-500">
                                                                Entire day available within working hours. Other
                                                                slots will be overridden.
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={resetEditor}
                                                            className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => saveRule(editingForDay)}
                                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add button */}
                                            {!hasAllDay && editingForDay == null && (
                                                <button
                                                    onClick={() => setEditingForDay(value)}
                                                    className="w-full text-xs text-blue-600 hover:bg-blue-50 rounded py-1.5 font-medium"
                                                >
                                                    <Plus className="h-3.5 w-3.5 inline mr-1" />
                                                    Add Time Slot / All Day
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

            {/* Override Modal */}
            <Modal
                open={showOverride}
                onClose={() => setShowOverride(false)}
                title="Override With All Day"
            >
                <p className="text-sm text-gray-700">
                    Existing slots will be{" "}
                    <span className="text-red-600 font-medium">removed</span> if you mark
                    this day as <span className="font-medium">All Day</span>. Continue?
                </p>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => setShowOverride(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => applyAllDay(pendingAllDayDay)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Override
                    </button>
                </div>
            </Modal>
        </div>
    );
}
