// src/components/common/modal/ViewAppointmentModal.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    X, Pencil, Info, Check, RotateCcw, Trash2,
    CalendarClock, Clock, Tag, User, Mail, Phone, MapPin, StickyNote
} from "lucide-react";
import DatePopover from "../../ui/DatePopover";
import TimePopover from "../../ui/TimePopover";

/**
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - appointment: {
 *     id, title, clientName, email, phone, address,
 *     serviceType, status, date, time, allDay, purpose, notes,
 *     start, end, cancelReason?
 *   }
 * - onUpdate: (updatedAppointment) => void
 * - fetchAvailableTimes?: (dateISO, serviceType) => Promise<string[]> // "HH:mm"
 */
export default function ViewAppointmentModal({
    isOpen,
    onClose,
    appointment,
    onUpdate,
    fetchAvailableTimes,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [action, setAction] = useState(null); // 'approve' | 'reschedule' | 'cancel' | null
    const [local, setLocal] = useState(appointment || {});
    const [reschedDate, setReschedDate] = useState("");
    const [reschedTime, setReschedTime] = useState("");
    const [timeSuggestions, setTimeSuggestions] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // hydrate local state when appointment changes / modal opens
    useEffect(() => {
        if (!appointment) return;
        setLocal(appointment);
        setIsEditing(false);
        setAction(null);
        setReschedDate(appointment.date || "");
        setReschedTime(appointment.time || "");
        setCancelReason(appointment.cancelReason || "");
    }, [appointment, isOpen]);

    // fetch times when rescheduling date/service changes
    useEffect(() => {
        let active = true;
        (async () => {
            if (action !== "reschedule") return;
            if (!reschedDate) {
                setTimeSuggestions([]);
                return;
            }
            setLoadingTimes(true);
            try {
                const list = typeof fetchAvailableTimes === "function"
                    ? await fetchAvailableTimes(reschedDate, local.serviceType)
                    : mockGenerateTimes("08:00", "17:30", 30);
                if (active) setTimeSuggestions(Array.isArray(list) ? list : []);
            } catch {
                if (active) setTimeSuggestions([]);
            } finally {
                if (active) setLoadingTimes(false);
            }
        })();
        return () => { active = false; };
    }, [action, reschedDate, local.serviceType, fetchAvailableTimes]);

    const initials = useMemo(() => {
        const n = String(local?.clientName || "").trim();
        return n ? n.split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase() : "??";
    }, [local?.clientName]);

    if (!isOpen) return null;

    const statusTone = getStatusTone(local?.status);

    function handleApprove() {
        setAction("approve");
    }
    function handleReschedule() {
        setAction("reschedule");
    }
    function handleCancel() {
        setAction("cancel");
    }

    function handleSaveApproval() {
        const updated = { ...local, status: "Confirmed" };
        onUpdate?.(updated);
    }

    function handleSaveReschedule() {
        if (!reschedDate || !reschedTime) return;

        // Build local Date objects to avoid UTC shifts
        const [y, m, d] = reschedDate.split("-").map(Number);
        const [hh, mm] = reschedTime.split(":").map(Number);

        const start = new Date(y, m - 1, d, hh, mm, 0, 0);       // local time
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +60 mins

        const updated = {
            ...local,
            date: reschedDate,
            time: reschedTime,
            start,   // pass Date objects (preferred by FullCalendar)
            end,
            status: "In Process",
        };

        onUpdate?.(updated);
    }


    function handleSaveCancellation() {
        const updated = {
            ...local,
            status: "Cancelled",
            cancelReason: (cancelReason || "").trim(),
        };
        onUpdate?.(updated);
    }

    function handleEditToggle() {
        setIsEditing(v => !v);
    }

    function handleSaveDetails() {
        // Here we only allow editing Notes and Purpose for simplicity.
        // Expand as needed (email/phone/etc) if your policy allows.
        onUpdate?.(local);
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 h-screen z-[999] bg-black/30"
                onClick={onClose}
            />
            {/* Slide-over panel */}
            <aside
                className="
          fixed right-4 top-4 z-[999]
          w-full max-w-2xl h-[90vh]
          rounded-xl overflow-hidden
          bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700
          shadow-xl flex flex-col
        "
                role="dialog"
                aria-modal="true"
                aria-labelledby="view-appt-title"
            >
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Appointment</p>
                        <h2 id="view-appt-title" className="text-sm text-gray-900 dark:text-gray-100">
                            #{local?.id || "—"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEditToggle}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                            title={isEditing ? "Stop editing" : "Edit details"}
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {/* Client Info */}
                    <section className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm shrink-0">
                            {initials}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
                            <h3 className="text-gray-900 dark:text-gray-100 mt-1">
                                {local?.clientName || "—"}
                            </h3>
                        </div>
                    </section>

                    {/* Status Actions */}
                    <section className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4">
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 mb-4">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-xs leading-relaxed">
                                Changing the status notifies the client. Approving locks the current date/time.
                                Rescheduling requires selecting a new slot.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleApprove}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors
                  ${action === "approve"
                                        ? "bg-emerald-500 text-white"
                                        : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"}
                `}
                            >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                            </button>
                            <button
                                onClick={handleReschedule}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors
                  ${action === "reschedule"
                                        ? "bg-blue-500 text-white"
                                        : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"}
                `}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reschedule
                            </button>
                            <button
                                onClick={handleCancel}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors
                  ${action === "cancel"
                                        ? "bg-red-500 text-white"
                                        : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"}
                `}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                        </div>

                        {/* Action panels */}
                        {action === "approve" && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between">
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Approve this appointment and notify the client?
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="px-2.5 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveApproval}
                                        className="px-2.5 py-1 text-xs rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}

                        {action === "reschedule" && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <DatePopover value={reschedDate} onChange={setReschedDate} />
                                    <TimePopover
                                        value={reschedTime}
                                        onChange={setReschedTime}
                                        suggestions={timeSuggestions}
                                        loading={loadingTimes}
                                        disabled={!reschedDate}
                                        minuteStep={5}
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="px-2.5 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveReschedule}
                                        disabled={!reschedDate || !reschedTime}
                                        className="px-2.5 py-1 text-xs rounded-md bg-blue-500 text-white disabled:opacity-50 hover:bg-blue-600"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}

                        {action === "cancel" && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 space-y-3">
                                <textarea
                                    rows={2}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Reason for cancellation..."
                                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setAction(null)}
                                        className="px-2.5 py-1 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                                    >
                                        Keep
                                    </button>
                                    <button
                                        onClick={handleSaveCancellation}
                                        className="px-2.5 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                                    >
                                        Cancel appointment
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Appointment Details */}
                    <section>
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-4">Appointment Details</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {formatDateTime(local?.date, local?.time)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Service</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {local?.serviceType || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                        <StatusBadge tone={statusTone}>{local?.status || "—"}</StatusBadge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section>
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-4">Contact Information</h4>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {local?.email || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {local?.phone || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        {local?.address || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section>
                        <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-4">Notes</h4>
                        {isEditing ? (
                            <textarea
                                rows={3}
                                value={local?.notes || ""}
                                onChange={(e) => setLocal(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional notes..."
                            />
                        ) : (
                            <div className="rounded-md border border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800/50">
                                <div className="flex items-start gap-2">
                                    <StickyNote className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {local?.notes?.trim() ? local.notes : "No additional notes"}
                                    </p>
                                </div>
                                {local?.status === "Cancelled" && (
                                    <div className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                                        <p className="text-xs text-red-800 dark:text-red-200">
                                            <span className="font-medium">Cancellation reason:</span> {local?.cancelReason || "No reason provided"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Changes are saved automatically
                    </p>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                                Edit details
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => { setIsEditing(false); setLocal(appointment); }}
                                    className="px-3 py-1.5 text-xs rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-800"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); handleSaveDetails(); }}
                                    className="px-3 py-1.5 text-xs rounded-md bg-emerald-500 text-white hover:bg-emerald-600"
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                </footer>
            </aside>
        </>
    );
}

/* ---- Helper Components ---- */
function StatusBadge({ children, tone = "neutral" }) {
    const variants = {
        neutral: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${variants[tone] || variants.neutral}`}>
            {children}
        </span>
    );
}





function getStatusTone(status) {
    const s = String(status || "").toLowerCase();
    if (["confirmed", "approved", "completed"].some(k => s.includes(k))) return "ok";
    if (["pending", "in process"].some(k => s.includes(k))) return "warn";
    if (["cancelled", "canceled"].some(k => s.includes(k))) return "danger";
    return "neutral";
}

function formatDateTime(dateISO, hhmm) {
    if (!dateISO) return "—";
    if (!hhmm) return dateISO;

    // Convert "HH:mm" -> 12-hour format with AM/PM
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;

    return `${dateISO} · ${formatted}`;
}

/* Utility functions */
function mockGenerateTimes(startHHmm = "08:00", endHHmm = "17:30", everyMin = 30) {
    const [sh, sm] = startHHmm.split(":").map(Number);
    const [eh, em] = endHHmm.split(":").map(Number);
    const out = [];
    let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        m += everyMin;
        while (m >= 60) { m -= 60; h += 1; }
    }
    return out;
}

function addMinutes(hhmm, add) {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m + add;
    const nh = Math.floor((((total % 1440) + 1440) % 1440) / 60);
    const nm = ((total % 60) + 60) % 60;
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}