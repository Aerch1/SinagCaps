// src/pages/Public/settings/panels/AppointmentDetailPanel.jsx
"use client";
import { useMemo, useRef, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getApptById } from "./appointmentsDemo";
import {
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    Activity,
    RefreshCcw,
    XCircle,
    MoreVertical,
} from "lucide-react";

/* rows to match other panels */
function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-6 px-6 py-5 border-b border-gray-200">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-sm font-medium text-gray-900 truncate">{value ?? "—"}</div>
        </div>
    );
}

/* actions dropdown (UI only) */
function ActionsMenu({ disabled = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
        const onEsc = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onEsc);
        };
    }, []);
    const item =
        "flex items-center gap-3 w-full text-left text-sm px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700";
    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
                Actions <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div
                className={`absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg transition origin-top-right
        ${open ? "opacity-100 scale-100 z-40" : "pointer-events-none opacity-0 scale-95"}`}
            >
                <div className="p-2">
                    <button className={item} onClick={() => setOpen(false)}>Request reschedule</button>
                    <button className={item} onClick={() => setOpen(false)}>Cancel appointment</button>
                    <button className={item} onClick={() => setOpen(false)}>View details</button>
                </div>
            </div>
        </div>
    );
}

/* status metadata + stepper */
const STATUS_META = {
    pending: { label: "Pending", icon: Clock, track: "bg-emerald-500", ring: "ring-amber-500", node: "bg-amber-50 text-amber-600" },
    approved: { label: "Approved", icon: Check, track: "bg-emerald-500", ring: "ring-emerald-500", node: "bg-emerald-50 text-emerald-700" },
    rescheduled: { label: "Rescheduled", icon: RefreshCcw, track: "bg-emerald-500", ring: "ring-violet-500", node: "bg-violet-50 text-violet-700" },
    "in-progress": { label: "In Progress", icon: Activity, track: "bg-emerald-500", ring: "ring-sky-500", node: "bg-sky-50 text-sky-700" },
    completed: { label: "Completed", icon: Check, track: "bg-emerald-500", ring: "ring-emerald-600", node: "bg-emerald-600 text-white" },
    cancelled: { label: "Cancelled", icon: XCircle, track: "bg-rose-500", ring: "ring-rose-500", node: "bg-rose-50 text-rose-700" },
};

function buildWorkflow({ status, wasRescheduled, inProgress }) {
    if (status === "cancelled") return ["pending", "approved", "cancelled"];
    const steps = ["pending", "approved"];
    if (wasRescheduled) steps.push("rescheduled");
    if (inProgress) steps.push("in-progress");
    steps.push("completed");
    if (!steps.includes(status)) steps.push(status);
    return steps;
}

function StatusStepper({ status, wasRescheduled, inProgress }) {
    const steps = useMemo(
        () => buildWorkflow({ status, wasRescheduled, inProgress }),
        [status, wasRescheduled, inProgress]
    );
    const currentIdx = Math.max(steps.indexOf(status), 0);
    const isCancelled = status === "cancelled";
    const pct = steps.length > 1 ? (currentIdx / (steps.length - 1)) * 100 : 0;

    return (
        <div className="px-6 py-8">
            <div className="relative">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200" />
                <div
                    className={`absolute left-0 top-4 h-0.5 ${isCancelled ? "bg-rose-500" : "bg-emerald-500"} transition-all`}
                    style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                    {steps.map((key, i) => {
                        const meta = STATUS_META[key] || STATUS_META.pending;
                        const done = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        const ring = done ? "ring-emerald-500" : isCurrent ? meta.ring : "ring-gray-300";
                        const node = done
                            ? "bg-emerald-50 text-emerald-700"
                            : isCurrent
                                ? meta.node
                                : "bg-gray-100 text-gray-400";
                        const Icon = isCurrent ? meta.icon : done ? Check : null;
                        return (
                            <div key={`${key}-${i}`} className="flex flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ${ring} ${node}`}>
                                    {Icon ? <Icon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-gray-300" />}
                                </div>
                                <div className="mt-2 text-xs font-medium text-gray-700">
                                    {STATUS_META[key]?.label || key}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function AppointmentDetailPanel() {
    const { id } = useParams();
    const appt = getApptById(id);

    if (!appt) {
        return (
            <section className="bg-white">
                <div className="max-w-4xl mx-auto py-6 px-6">
                    <Link to="../appointments" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary">
                        <ChevronLeft className="h-4 w-4" /> Back to appointments
                    </Link>
                    <div className="mt-6 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                        Appointment not found.
                    </div>
                </div>
            </section>
        );
    }

    const d = new Date(appt.startsAt);
    const datePretty = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    const timePretty = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

    const actionsDisabled = appt.status === "completed" || appt.status === "cancelled";

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="px-6 pt-4">
                    <Link to="../appointments" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary">
                        <ChevronLeft className="h-4 w-4" /> Back to appointments
                    </Link>
                </div>

                <div className="mt-3 overflow-hidden border border-gray-200 rounded-xl">
                    {/* header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 grid place-items-center">
                                <ClipboardList className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">Appointment Details</div>
                                <div className="text-xs text-gray-600">Transaction {appt.ref}</div>
                            </div>
                        </div>
                        <ActionsMenu disabled={actionsDisabled} />
                    </div>

                    {/* details rows */}
                    <DetailRow label="Name" value={appt.name} />
                    <DetailRow label="Service" value={appt.service || "Transaction"} />
                    <DetailRow label="Date" value={datePretty} />
                    <DetailRow label="Time" value={timePretty} />
                    <DetailRow label="Transaction No." value={appt.ref} />

                    {/* stepper */}
                    <StatusStepper
                        status={appt.status}
                        wasRescheduled={appt.wasRescheduled}
                        inProgress={appt.inProgress}
                    />

                    {/* optional footer nav */}
                    <div className="flex items-center justify-end gap-2 px-6 py-4">
                        <Link
                            to="../appointments"
                            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary"
                        >
                            Back <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
