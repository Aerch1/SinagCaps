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
import TimeSelector from "../../ui/TimeSelector";
import { WEEKDAYS, to12h, parseDate } from "@/utils/availabilityUtils";
import useChurchHours from "@/hooks/useChurchHours";
import { useAdminAvailabilityStore } from "../../../store/adminAvailabilityStore.js";
import toast from "react-hot-toast";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";

/* ---------- Helpers ---------- */
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

export default function WeeklyRulesPanel({ serviceId }) {
    const { rules, addRule, updateRule, deleteRule, toggleBlockWeekday } =
        useAdminAvailabilityStore();
    const { churchHours } = useChurchHours();

    /* ---------- UI State ---------- */
    const [expandedDays, setExpandedDays] = useState({});
    const [editingForDay, setEditingForDay] = useState(null);
    const [editRuleData, setEditRuleData] = useState(null);

    const [mode, setMode] = useState("single");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [every, setEvery] = useState(30);

    // confirm dialog state
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

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

    /* ---------- Save Rule ---------- */
    const saveRule = async (weekday) => {
        if (mode === "allday") {
            await applyAllDay(weekday);
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

    /* ---------- Toggle Block ---------- */
    const handleToggleBlock = async (weekday, blocked) => {
        // check for weekly rules OR custom rules that fall on the same weekday
        const existing = (rules || []).filter(
            (r) => r.weekday === weekday || (r.date && parseDate(r.date)?.getDay() === weekday)
        );

        if (blocked && existing.length > 0) {
            setConfirmAction(() => async () => {
                await toggleBlockWeekday(serviceId, weekday, true);
            });
            setShowConfirm(true);
            return;
        }

        await toggleBlockWeekday(serviceId, weekday, blocked);
    };

    /* ---------- Apply AllDay ---------- */
    const applyAllDay = async (weekday) => {
        const hours = churchHours?.[weekday];
        if (!hours || hours.is_closed) {
            toast.error("Church is closed on this day");
            return;
        }

        const existing = (rules || []).filter((r) => r.weekday === weekday);
        if (existing.length > 0) {
            setConfirmAction(() => async () => {
                await addOrUpdateAllDay(weekday, hours);
            });
            setShowConfirm(true);
            return;
        }

        await addOrUpdateAllDay(weekday, hours);
    };

    const addOrUpdateAllDay = async (weekday, hours) => {
        if (!editRuleData) {
            await addRule(serviceId, {
                weekday,
                type: "allday",
                status: "available",
                start: hours.open_time,
                end: hours.close_time,
                slots: null,
                override: true,
            });
        } else {
            await updateRule(editRuleData.id, {
                ...editRuleData,
                weekday,
                type: "allday",
                status: "available",
                start: hours.open_time,
                end: hours.close_time,
                slots: null,
                override: true,
            });
        }
        resetEditor();
    };

    /* ---------- Remove Rule ---------- */
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

    /* ---------- Occurrence Info ---------- */
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
        <>
            <div className="space-y-2 md:space-y-3 w-full overflow-hidden">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-1.5 md:gap-2">
                        <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
                        <span className="truncate">Weekly Schedule Rules</span>
                    </h3>
                </div>

                <div className="space-y-1.5 md:space-y-2">
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
                                className="bg-white border border-gray-200 rounded-md md:rounded-lg overflow-hidden"
                            >
                                <div className="p-2 md:p-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                                        <div className="h-7 w-7 md:h-8 md:w-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                                                {label}
                                            </div>
                                            <div className="text-[10px] md:text-xs text-gray-500 truncate">
                                                {hasAllDay
                                                    ? "All Day"
                                                    : rulesForDay.length
                                                        ? `${rulesForDay.length} rule(s)`
                                                        : "Available"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Block Toggle */}
                                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={isBlocked}
                                                onChange={(e) =>
                                                    handleToggleBlock(value, e.target.checked)
                                                }
                                            />
                                            <div className="peer h-5 w-9 md:h-6 md:w-11 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-red-500" />
                                            <span className="absolute top-0.5 left-0.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out peer-checked:translate-x-4 md:peer-checked:translate-x-5" />
                                        </label>
                                        <span
                                            className={`text-[10px] md:text-xs font-medium whitespace-nowrap ${isBlocked ? "text-red-600" : "text-gray-600"
                                                }`}
                                        >
                                            {isBlocked ? "Blocked" : "Open"}
                                        </span>

                                        <button
                                            onClick={() => toggleExpand(value)}
                                            className="p-1 md:p-1.5 hover:bg-gray-100 rounded"
                                        >
                                            {expanded ? (
                                                <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {expanded && (
                                    <div className="px-2 md:px-3 pb-2 md:pb-3 space-y-1.5 md:space-y-2">
                                        {rulesForDay.map((rule) => {
                                            const hours = churchHours?.[value];
                                            const isAllDay = rule.type === "allday";
                                            const isBlocked =
                                                isAllDay && rule.status === "blocked";

                                            return (
                                                <div
                                                    key={rule.id}
                                                    className="flex items-start justify-between bg-gray-50 px-2 md:px-3 py-1.5 md:py-2 rounded border gap-2"
                                                >
                                                    <div className="text-xs md:text-sm min-w-0 flex-1">
                                                        {isAllDay ? (
                                                            isBlocked ? (
                                                                <div className="font-semibold text-red-600">
                                                                    Blocked
                                                                </div>
                                                            ) : (
                                                                <div className="font-semibold text-emerald-700 truncate">
                                                                    {to12h(rule.start || hours?.open_time) || "—"}{" "}
                                                                    – {to12h(rule.end || hours?.close_time) || "—"}{" "}
                                                                    Available
                                                                </div>
                                                            )
                                                        ) : rule.type === "recurring" ? (
                                                            <>
                                                                <div className="font-mono font-medium text-[10px] md:text-xs truncate">
                                                                    {to12h(rule.start)} – {to12h(rule.end)} every{" "}
                                                                    {rule.interval_mins}m
                                                                </div>
                                                                <div className="text-[10px] md:text-xs text-gray-700">
                                                                    {rule.slots == null
                                                                        ? "• Available"
                                                                        : `• ${rule.slots} slots`}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-mono font-medium text-[10px] md:text-xs">
                                                                    {to12h(rule.time)}
                                                                </div>
                                                                <div className="text-[10px] md:text-xs text-gray-700">
                                                                    {rule.slots == null
                                                                        ? "• Available"
                                                                        : `• ${rule.slots} slots`}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                                        {!isAllDay && !isBlocked && (
                                                            <button
                                                                onClick={() => editRule(value, rule)}
                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                            >
                                                                <Edit2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => removeRule(rule)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <Trash2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Add/Edit Form */}
                                        {editingForDay === value && (
                                            <div className="mt-1.5 md:mt-2 border rounded bg-blue-50 p-2 md:p-3 space-y-2 md:space-y-3">
                                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="radio"
                                                            checked={mode === "single"}
                                                            onChange={() => setMode("single")}
                                                        />{" "}
                                                        <span className="whitespace-nowrap">Single Slot</span>
                                                    </label>
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="radio"
                                                            checked={mode === "recurring"}
                                                            onChange={() => setMode("recurring")}
                                                        />{" "}
                                                        <span className="whitespace-nowrap">Recurring</span>
                                                    </label>
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="radio"
                                                            checked={mode === "allday"}
                                                            onChange={() => setMode("allday")}
                                                        />{" "}
                                                        <span className="whitespace-nowrap">All Day</span>
                                                    </label>
                                                </div>

                                                {mode === "single" && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-start">
                                                        <TimeSelector
                                                            value={time}
                                                            onChange={setTime}
                                                            churchHours={churchHours}
                                                            weekday={value}
                                                            label="Pick a Time"
                                                        />
                                                        <div className="w-full">
                                                            <label className="block text-xs md:text-sm font-medium mb-1">
                                                                Slots (optional)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={slots}
                                                                min="1"
                                                                onChange={(e) => setSlots(e.target.value)}
                                                                placeholder="e.g. 5"
                                                                className="w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {mode === "recurring" && (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-start">
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
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-start">
                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium mb-1">
                                                                    Interval (mins)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={every}
                                                                    min="5"
                                                                    step="5"
                                                                    onChange={(e) =>
                                                                        setEvery(Number(e.target.value))
                                                                    }
                                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium mb-1">
                                                                    Slots (optional)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={slots}
                                                                    min="1"
                                                                    onChange={(e) => setSlots(e.target.value)}
                                                                    placeholder="e.g. 5"
                                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-0"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] md:text-xs text-gray-600">
                                                            Possible occurrences:{" "}
                                                            <span className="font-medium">
                                                                {occInfo.occ}
                                                            </span>
                                                            {occInfo.warn && (
                                                                <span className="ml-1 md:ml-2 text-amber-700 inline-flex items-center gap-0.5 md:gap-1">
                                                                    <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3" />{" "}
                                                                    <span className="break-words">{occInfo.warn}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {mode === "allday" && (
                                                    <div className="text-xs md:text-sm text-gray-800">
                                                        {to12h(churchHours?.[value]?.open_time) || "—"} –{" "}
                                                        {to12h(churchHours?.[value]?.close_time) || "—"}
                                                        <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                                                            Entire day available within working hours.
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-1.5 md:gap-2">
                                                    <button
                                                        onClick={resetEditor}
                                                        className="px-2 md:px-3 py-1 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => saveRule(editingForDay)}
                                                        className="px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        {editRuleData ? "Update" : "Save"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!hasAllDay && editingForDay == null && (
                                            <button
                                                onClick={() => setEditingForDay(value)}
                                                className="w-full text-[10px] md:text-xs text-blue-600 hover:bg-blue-50 rounded py-1 md:py-1.5 font-medium"
                                            >
                                                <Plus className="h-3 w-3 md:h-3.5 md:w-3.5 inline mr-0.5 md:mr-1" />
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

            {/* Confirm override dialog */}
            <ConfirmDialog
                open={showConfirm}
                title="Override Existing Rules?"
                message="This day already has custom or weekly schedules. Blocking will override them"
                onConfirm={() => {
                    setShowConfirm(false);
                    confirmAction?.();
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}