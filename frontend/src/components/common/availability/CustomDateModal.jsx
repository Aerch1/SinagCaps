import { useState, useEffect, useMemo } from "react";
import { Trash2, Pencil, AlertTriangle } from "lucide-react";
import Modal from "../../ui/Modal";
import TimeSelector from "../../ui/TimeSelector";
import { formatDate, parseDate, to12h } from "@/utils/availabilityUtils";
import useChurchHours from "../../../hooks/useChurchHours.js";
import { useAdminAvailabilityStore } from "../../../store/adminAvailabilityStore.js";

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

export default function CustomDateModal({
    serviceId,
    selectedDate,
    editingRule = null,
    open,
    onClose,
}) {
    const { rules, addRule, updateRule, deleteRule, fetchRules } =
        useAdminAvailabilityStore();
    const { churchHours } = useChurchHours();

    const [mode, setMode] = useState("single");
    const [time, setTime] = useState("");
    const [slots, setSlots] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [every, setEvery] = useState(30);

    const [startDate, setStartDate] = useState(selectedDate || "");
    const [endDate, setEndDate] = useState(selectedDate || "");

    const [existingRules, setExistingRules] = useState([]);
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [pendingDates, setPendingDates] = useState([]);

    useEffect(() => {
        if (!open || !selectedDate) return;

        const byDate = (rules || []).filter(
            (r) => formatDate(r.date) === selectedDate
        );
        setExistingRules(byDate);

        if (editingRule) {
            setMode(editingRule.status === "blocked" ? "blocked" : editingRule.type);
            setTime(editingRule.time || "");
            setSlots(editingRule.slots == null ? "" : String(editingRule.slots));
            setStart(editingRule.start || "");
            setEnd(editingRule.end || "");
            setEvery(editingRule.interval_mins || 30);
            setStartDate(formatDate(editingRule.date));
            setEndDate(formatDate(editingRule.date));
        } else {
            setMode("single");
            setTime("");
            setSlots("");
            setStart("");
            setEnd("");
            setEvery(30);
            setStartDate(selectedDate || "");
            setEndDate(selectedDate || "");
        }
    }, [open, selectedDate, editingRule, rules]);

    const occInfo = useMemo(() => {
        if (mode !== "recurring" || !start || !end || !every)
            return { occ: 0, warn: "" };
        const occ = occurrencesBetween(start, end, Number(every));
        let warn = "";
        const typed = slots === "" ? null : parseInt(slots, 10) || 0;
        if (typed != null && typed > occ) {
            warn = `Only ${occ} occurrences fit between ${to12h(
                start
            )} and ${to12h(end)} every ${every} mins.`;
        }
        return { occ, warn };
    }, [mode, start, end, every, slots]);

    /* ---------- SAVE ---------- */
    const handleSave = async () => {
        const rangeStart = parseDate(startDate);
        const rangeEndCandidate = endDate ? parseDate(endDate) : null;
        if (!rangeStart) return;

        const loopEnd =
            rangeEndCandidate && rangeEndCandidate >= rangeStart
                ? rangeEndCandidate
                : rangeStart;


        const existingForStart = rules.filter(
            (r) => formatDate(r.date) === formatDate(rangeStart)
        );
        if (
            (mode === "single" || mode === "recurring") &&
            existingForStart.some(
                (r) => r.status === "blocked" || r.type === "allday"
            )
        ) {
            alert(
                "This date already has an All Day or Blocked rule. You cannot add single/recurring."
            );
            return;
        }


        if (editingRule?.id) {
            const iso = formatDate(rangeStart);
            await updateRule(editingRule.id, {
                ...editingRule,
                date: iso,
                type: mode === "blocked" ? "allday" : mode,
                time: mode === "single" ? time : null,
                start: mode === "recurring" || mode === "allday" ? start : null,
                end: mode === "recurring" || mode === "allday" ? end : null,
                interval_mins: mode === "recurring" ? every : null,
                slots: slots === "" ? null : parseInt(slots, 10),
                status: mode === "blocked" ? "blocked" : "available",
            });
            await fetchRules(serviceId);
            onClose();
            return;
        }

        const needOverride = [];
        for (let d = new Date(rangeStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
            const iso = formatDate(d);
            const hasRules = rules.some((r) => formatDate(r.date) === iso);
            if ((mode === "allday" || mode === "blocked") && hasRules) {
                needOverride.push(iso);
            }
        }

        if (needOverride.length > 0 && !overrideOpen) {
            setPendingDates(needOverride);
            setOverrideOpen(true);
            return;
        }

        await performSave(rangeStart, loopEnd);
        await fetchRules(serviceId);
        onClose();
    };

    const performSave = async (start, end) => {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const iso = formatDate(d);
            await addRule(serviceId, {
                date: iso,
                type: mode === "blocked" ? "allday" : mode,
                time: mode === "single" ? time : null,
                start: mode === "recurring" || mode === "allday" ? start : null,
                end: mode === "recurring" || mode === "allday" ? end : null,
                interval_mins: mode === "recurring" ? every : null,
                slots: slots === "" ? null : parseInt(slots, 10),
                status: mode === "blocked" ? "blocked" : "available",
            });
        }
    };

    const removeRule = async (rule) => {
        if (rule.id) {
            await deleteRule(rule.id);
            await fetchRules(serviceId);
        }
    };

    if (!open) return null;

    return (
        <>
            <Modal open={open} onClose={onClose} title="Custom Date Setup" className="max-w-lg">
                {/* Date range */}
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

                {/* Existing rules list */}
                {existingRules.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Existing Rules</p>
                        <div className="space-y-2">
                            {existingRules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2 text-sm"
                                >
                                    <span>
                                        {rule.type === "allday" &&
                                            (rule.status === "blocked"
                                                ? "All Day • Blocked"
                                                : `All Day • ${to12h(rule.start)} – ${to12h(rule.end)}`)}
                                        {rule.type === "single" &&
                                            `${to12h(rule.time)} • ${rule.slots == null ? "Available" : `${rule.slots} slots`
                                            }`}
                                        {rule.type === "recurring" &&
                                            `${to12h(rule.start)} – ${to12h(rule.end)} every ${rule.interval_mins
                                            }m • ${rule.slots == null ? "Available" : `${rule.slots} slots`
                                            }`}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setMode(rule.status === "blocked" ? "blocked" : rule.type);
                                                setTime(rule.time || "");
                                                setSlots(rule.slots == null ? "" : String(rule.slots));
                                                setStart(rule.start || "");
                                                setEnd(rule.end || "");
                                                setEvery(rule.interval_mins || 30);
                                                setStartDate(formatDate(rule.date));
                                                setEndDate(formatDate(rule.date));
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => removeRule(rule)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mode selector */}
                <div className="flex gap-2 mb-6">
                    {["single", "recurring", "allday", "blocked"].map((m) => {
                        const disabled =
                            (m === "single" || m === "recurring") &&
                            existingRules.some(
                                (r) => r.status === "blocked" || r.type === "allday"
                            );
                        return (
                            <button
                                key={m}
                                onClick={() => !disabled && setMode(m)}
                                disabled={disabled}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${disabled
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : mode === m
                                            ? m === "blocked"
                                                ? "bg-red-100 text-red-700 border border-red-300"
                                                : "bg-blue-100 text-blue-700 border border-blue-300"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {m === "single" && "Single Slot"}
                                {m === "recurring" && "Recurring"}
                                {m === "allday" && "All Day"}
                                {m === "blocked" && "Blocked"}
                            </button>
                        );
                    })}
                </div>


                {mode === "single" && (
                    <div className="grid grid-cols-2 gap-3 items-start">
                        <TimeSelector
                            value={time}
                            onChange={setTime}
                            churchHours={churchHours}
                            weekday={parseDate(startDate)?.getDay()}
                            label="Pick a Time"
                        />
                        <div>
                            <label className="block text-sm font-medium mb-1">Slots (optional)</label>
                            <input
                                type="number"
                                value={slots}
                                min="1"
                                onChange={(e) => setSlots(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
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
                                weekday={parseDate(startDate)?.getDay()}
                                label="Start Time"
                            />
                            <TimeSelector
                                value={end}
                                onChange={setEnd}
                                churchHours={churchHours}
                                weekday={parseDate(startDate)?.getDay()}
                                label="End Time"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 items-start mt-2">
                            <div>
                                <label className="block text-sm font-medium mb-1">Interval (mins)</label>
                                <input
                                    type="number"
                                    value={every}
                                    min="5"
                                    step="5"
                                    onChange={(e) => setEvery(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slots (optional)</label>
                                <input
                                    type="number"
                                    value={slots}
                                    min="1"
                                    onChange={(e) => setSlots(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                            Possible occurrences: <span className="font-medium">{occInfo.occ}</span>
                            {occInfo.warn && (
                                <span className="ml-2 text-amber-700 inline-flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> {occInfo.warn}
                                </span>
                            )}
                        </div>
                    </>
                )}

                {mode === "allday" && (
                    <div className="text-sm text-gray-800">
                        {to12h(churchHours[parseDate(startDate)?.getDay()]?.open_time)} –{" "}
                        {to12h(churchHours[parseDate(startDate)?.getDay()]?.close_time)}
                        <div className="text-xs text-gray-500">Entire day available.</div>
                    </div>
                )}

                {mode === "blocked" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-700">
                        The selected date(s) will be completely unavailable.
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {editingRule ? "Update Rule" : "Save Changes"}
                    </button>
                </div>
            </Modal>

            {/* Override confirm */}
            <Modal
                open={overrideOpen}
                onClose={() => setOverrideOpen(false)}
                title="Override Existing Rules"
            >
                <p className="text-sm text-gray-700">
                    The selected date(s) already have rules. Marking as{" "}
                    <span className="font-medium">
                        {mode === "blocked" ? "Blocked" : "All Day"}
                    </span>{" "}
                    will <span className="text-red-600 font-medium">remove</span> all existing
                    rules for those date(s). Continue?
                </p>
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={() => setOverrideOpen(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            setOverrideOpen(false);
                            const s = parseDate(startDate);
                            const eC = endDate ? parseDate(endDate) : null;
                            const loopEnd = eC && eC >= s ? eC : s;

                            for (let d = new Date(s); d <= loopEnd; d.setDate(d.getDate() + 1)) {
                                const iso = formatDate(d);
                                if (pendingDates.includes(iso)) {
                                    const toDelete = rules.filter((r) => formatDate(r.date) === iso);
                                    for (const r of toDelete) await deleteRule(r.id);
                                }
                            }

                            await performSave(s, loopEnd);
                            await fetchRules(serviceId);
                            onClose();
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Override
                    </button>
                </div>
            </Modal>
        </>
    );
}
