"use client";

import React, { useState, useMemo } from "react";
import {
    Trash2,
    Plus,
    Settings,
    Edit2,
    ChevronDown,
    ChevronUp,
    Calendar,
    AlertTriangle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import TimeSelector from "../../ui/TimeSelector";
import { WEEKDAYS, to12h } from "@/utils/availabilityUtils";
import useChurchHours from "@/hooks/useChurchHours";
import { useAdminAvailabilityStore } from "../../../store/adminAvailabilityStore.js";
import toast from "react-hot-toast";

/* Helpers */
const toMinutes = (t) => {
    const [h, m] = (t || "00:00").split(":").map((v) => parseInt(v, 10));
    return h * 60 + m;
};
const diffMinutes = (start, end) =>
    Math.max(0, toMinutes(end) - toMinutes(start));
const occurrencesBetween = (start, end, everyMins) => {
    if (!start || !end || !everyMins) return 0;
    const total = diffMinutes(start, end);
    return total <= 0 ? 0 : Math.floor(total / everyMins);
};

export default function WeeklyRulesPanel({ serviceId }) {
    const { rules, addRule, updateRule, deleteRule, toggleBlockWeekday } =
        useAdminAvailabilityStore();
    const { churchHours } = useChurchHours();

    /* UI state */
    const [expandedDays, setExpandedDays] = useState({});
    const [editingForDay, setEditingForDay] = useState(null);
    const [editRuleData, setEditRuleData] = useState(null);

    const [mode, setMode] = useState("single");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [every, setEvery] = useState(30);

    const resetEditor = () => {
        setMode("single");
        setTime("");
        setSlots("");
        setStart("");
        setEnd("");
        setEvery(30);
        setEditingForDay(null);
        setEditRuleData(null);
    };

    const toggleExpand = (day) =>
        setExpandedDays((p) => ({ ...p, [day]: !p[day] }));

    /* Save rule (manual add/edit) */
    const saveRule = async (weekday) => {
        if (mode === "allday") {
            await applyAllDay(weekday); // only "all day available"
            return;
        }

        if (mode === "single") {
            if (!time) return toast.error("Time is required");
            const parsedSlots =
                slots === "" ? null : Math.max(1, parseInt(slots, 10) || 0);
            if (!editRuleData) {
                await addRule(serviceId, {
                    weekday,
                    type: "single",
                    time,
                    slots: parsedSlots,
                    status: "available",
                });
            } else {
                await updateRule(editRuleData.id, {
                    weekday,
                    type: "single",
                    time,
                    slots: parsedSlots,
                    status: "available",
                });
            }
            resetEditor();
            return;
        }

        if (mode === "recurring") {
            if (!start || !end) return toast.error("Start and end time are required");
            if (toMinutes(end) <= toMinutes(start)) {
                return toast.error("End time must be after start time");
            }
            if (!every || every <= 0) return toast.error("Interval must be > 0");

            const occ = occurrencesBetween(start, end, Number(every));
            const parsedSlots =
                slots === "" ? null : Math.max(1, parseInt(slots, 10) || 0);
            const finalSlots =
                parsedSlots != null && parsedSlots > occ ? occ : parsedSlots;

            if (!editRuleData) {
                await addRule(serviceId, {
                    weekday,
                    type: "recurring",
                    start,
                    end,
                    interval_mins: every,
                    slots: finalSlots,
                    status: "available",
                });
            } else {
                await updateRule(editRuleData.id, {
                    weekday,
                    type: "recurring",
                    start,
                    end,
                    interval_mins: every,
                    slots: finalSlots,
                    status: "available",
                });
            }
            resetEditor();
        }
    };

    /* Toggle block (switch) → now calls backend directly */
    const handleToggleBlock = async (weekday, blocked) => {
        try {
            await toggleBlockWeekday(serviceId, weekday, blocked);
            // toast.success(blocked ? "Day blocked" : "Day unblocked");
        } catch (err) {
            console.error("❌ handleToggleBlock", err);
            toast.error("Failed to toggle block");
        }
    };

    /* Apply AllDay (only for available church hours) */
    const applyAllDay = async (weekday) => {
        const hours = churchHours?.[weekday];
        if (!hours || hours.is_closed) {
            toast.error("Church is closed on this day");
            return;
        }
        await addRule(serviceId, {
            weekday,
            type: "allday",
            status: "available",
            start: hours.open_time,
            end: hours.close_time,
            slots: null,
        });

        resetEditor();
    };

    const removeRule = async (rule) => {
        await deleteRule(rule.id);
        if (editRuleData?.id === rule.id) {
            resetEditor();
        }
    };

    const editRule = (weekday, rule) => {
        setEditingForDay(weekday);
        setEditRuleData(rule);
        if (rule.type === "allday") {
            setMode("allday");
            return;
        }
        if (rule.type === "single") {
            setMode("single");
            setTime(rule.time?.slice(0, 5) || "");
            setSlots(rule.slots == null ? "" : String(rule.slots));
        }
        if (rule.type === "recurring") {
            setMode("recurring");
            setStart(rule.start?.slice(0, 5) || "");
            setEnd(rule.end?.slice(0, 5) || "");
            setEvery(rule.interval_mins || 30);
            setSlots(rule.slots == null ? "" : String(rule.slots));
        }
    };

    const occInfo = useMemo(() => {
        if (mode !== "recurring" || !start || !end || !every)
            return { occ: 0, warn: "" };
        const occ = occurrencesBetween(start, end, Number(every));
        let warn = "";
        const typed = slots === "" ? null : parseInt(slots, 10) || 0;
        if (typed != null && typed > occ) {
            warn = `Only ${occ} occurrences fit between ${to12h(
                start
            )} and ${to12h(end)} every ${every} mins. Clamped.`;
        }
        return { occ, warn };
    }, [mode, start, end, every, slots]);

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
                    const rulesForDay = (rules || []).filter((r) => r.weekday === value);
                    const expanded = expandedDays[value];
                    const hasAllDay = rulesForDay.some((r) => r.type === "allday");
                    const isBlocked = rulesForDay.some(
                        (r) => r.type === "allday" && r.status === "blocked"
                    );

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
                                            {hasAllDay
                                                ? "All Day"
                                                : rulesForDay.length
                                                    ? `${rulesForDay.length} rule(s)`
                                                    : "Available"}
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ Block Toggle */}
                                <div className="flex items-center justify-center gap-2">
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={isBlocked}
                                            onChange={(e) =>
                                                handleToggleBlock(value, e.target.checked)
                                            }
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-red-500" />
                                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out peer-checked:translate-x-5" />
                                    </label>
                                    <span
                                        className={`text-xs font-medium ${isBlocked ? "text-red-600" : "text-gray-600"
                                            }`}
                                    >
                                        {isBlocked ? "Blocked" : "Open"}
                                    </span>

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
                                </div>
                            </div>

                            {expanded && (
                                <div className="px-3 pb-3 space-y-2">
                                    {rulesForDay.map((rule) => {
                                        const hours = churchHours?.[value];
                                        const isAllDay = rule.type === "allday";
                                        const isBlocked = isAllDay && rule.status === "blocked";

                                        return (
                                            <div
                                                key={rule.id}
                                                className="flex items-start justify-between bg-gray-50 px-3 py-2 rounded border"
                                            >
                                                <div className="text-sm">
                                                    {isAllDay ? (
                                                        isBlocked ? (
                                                            <div className="font-semibold text-red-600">
                                                                Blocked
                                                            </div>
                                                        ) : (
                                                            <div className="font-semibold text-emerald-700">
                                                                {to12h(rule.start || hours?.open_time) || "—"} –{" "}
                                                                {to12h(rule.end || hours?.close_time) || "—"}{" "}
                                                                Available
                                                            </div>
                                                        )
                                                    ) : rule.type === "recurring" ? (
                                                        <>
                                                            <div className="font-mono font-medium">
                                                                {to12h(rule.start)} – {to12h(rule.end)} every{" "}
                                                                {rule.interval_mins}m
                                                            </div>
                                                            <div className="text-xs text-gray-700">
                                                                {rule.slots == null
                                                                    ? "• Available"
                                                                    : `• ${rule.slots} slots`}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="font-mono font-medium">
                                                                {to12h(rule.time)}
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
                                                    {!isAllDay && !isBlocked && (
                                                        <button
                                                            onClick={() => editRule(value, rule)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeRule(rule)}
                                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add/Edit Form */}
                                    {editingForDay === value && (
                                        <div className="mt-2 border rounded bg-blue-50 p-3 space-y-3">
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
                                                <div className="grid grid-cols-2 gap-3 items-start">
                                                    <TimeSelector
                                                        value={time}
                                                        onChange={setTime}
                                                        churchHours={churchHours}
                                                        weekday={value}
                                                        label="Pick a Time"
                                                    />
                                                    <div className="w-full">
                                                        <label className="block text-sm font-medium mb-1">
                                                            Slots (optional)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={slots}
                                                            min="1"
                                                            onChange={(e) => setSlots(e.target.value)}
                                                            placeholder="e.g. 5"
                                                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {mode === "recurring" && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3 items-start">
                                                        <TimeSelector
                                                            value={start}
                                                            onChange={setStart}
                                                            churchHours={churchHours}
                                                            weekday={value}
                                                            label="Start Time"
                                                        />
                                                        <TimeSelector
                                                            value={end}
                                                            onChange={setEnd}
                                                            churchHours={churchHours}
                                                            weekday={value}
                                                            label="End Time"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 items-start mt-2">
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">
                                                                Interval (mins)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={every}
                                                                min="5"
                                                                step="5"
                                                                onChange={(e) => setEvery(Number(e.target.value))}
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">
                                                                Slots (optional)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={slots}
                                                                min="1"
                                                                onChange={(e) => setSlots(e.target.value)}
                                                                placeholder="e.g. 5"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-2">
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
                                                    {to12h(churchHours?.[value]?.open_time) || "—"} –{" "}
                                                    {to12h(churchHours?.[value]?.close_time) || "—"}
                                                    <div className="text-xs text-gray-500">
                                                        Entire day available within working hours.
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
                                                    {editRuleData ? "Update" : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!hasAllDay && editingForDay == null && (
                                        <button
                                            onClick={() => setEditingForDay(value)}
                                            className="w-full text-xs text-blue-600 hover:bg-blue-50 rounded py-1.5 font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5 inline mr-1" />
                                            Add Time Slot / All Day
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
