// src/pages/Public/settings/panels/AppointmentDetailPanel.jsx
"use client";
import { Fragment, useMemo, useRef, useState, useEffect } from "react";
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
                className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
                <MoreVertical className="h-4 w-4 text-gray-500" />
            </button>
            <div
                className={`absolute right-0  mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg transition origin-top-right ${open ? "opacity-100 scale-100 z-50" : "pointer-events-none opacity-0 scale-95"
                    }`}
            >
                <div className="p-2">
                    <button className={item} onClick={() => setOpen(false)}>
                        Request reschedule
                    </button>
                    <button className={item} onClick={() => setOpen(false)}>
                        Cancel appointment
                    </button>
                </div>
            </div>
        </div>
    );
}

/* status metadata */
const STATUS_META = {
    pending: { label: "Pending", icon: Clock, ring: "ring-amber-500", node: "bg-amber-50 text-amber-600" },
    approved: { label: "Approved", icon: Check, ring: "ring-emerald-500", node: "bg-emerald-50 text-emerald-700" },
    rescheduled: { label: "Rescheduled", icon: RefreshCcw, ring: "ring-rose-500", node: "bg-rose-50 text-rose-700" }, // hop to this is red
    "in-progress": { label: "In Progress", icon: Activity, ring: "ring-sky-500", node: "bg-sky-50 text-sky-700" },
    completed: { label: "Completed", icon: Check, ring: "ring-emerald-600", node: "bg-emerald-600 text-white" },
    cancelled: { label: "Cancelled", icon: XCircle, ring: "ring-rose-500", node: "bg-rose-50 text-rose-700" },
};

// Heuristic: where a cancel usually branches from in your flow
function getCancelFrom({ wasRescheduled, inProgress }) {
    if (wasRescheduled) return "rescheduled";
    if (inProgress) return "in-progress";
    return "approved";
}

/**
 * Build only the steps we need to display:
 * - Default: pending → approved → in-progress → completed
 * - Insert 'rescheduled' only if wasRescheduled
 * - If status is 'cancelled', trim to the branch point and append 'cancelled'
 */
function buildSteps({ status, wasRescheduled, inProgress }) {
    const base = ["pending", "approved", "in-progress", "completed"];
    let steps = base.slice();

    if (wasRescheduled) {
        const at = steps.indexOf("in-progress");
        steps.splice(at, 0, "rescheduled"); // after approved, before in-progress
    }

    if (status === "cancelled") {
        const cancelFrom = getCancelFrom({ wasRescheduled, inProgress });
        const idx = Math.max(steps.indexOf(cancelFrom), 0);
        steps = steps.slice(0, idx + 1);
        steps.push("cancelled");
    }

    return steps;
}

function StatusStepper({ status, wasRescheduled, inProgress }) {
    const steps = useMemo(
        () => buildSteps({ status, wasRescheduled, inProgress }),
        [status, wasRescheduled, inProgress]
    );

    const isCancelled = status === "cancelled";
    const currentIdx = Math.max(steps.indexOf(status), 0);
    // For cancelled, steps look like [..., <branchFrom>, 'cancelled']
    const preCancelIdx = isCancelled ? Math.max(steps.length - 2, 0) : null;

    // A node is "visited" when it’s at/before the current step (or up to the cancel branch).
    const isVisited = (i) => (isCancelled ? i <= preCancelIdx : i <= currentIdx);

    // Per-segment coloring: red only for the hop into rescheduled/cancelled; green for visited; gray for future.
    const segmentColor = (i) => {
        const nextKey = steps[i + 1];
        if (nextKey === "rescheduled" && wasRescheduled) return "bg-rose-500";
        if (nextKey === "cancelled" && isCancelled) return "bg-rose-500";
        const hopVisited = isCancelled ? i < preCancelIdx : i < currentIdx;
        return hopVisited ? "bg-emerald-500" : "bg-gray-200";
    };

    return (
        <div className="px-6 py-8">
            <div className="flex items-center">
                {steps.map((key, i) => {
                    const meta = STATUS_META[key] || STATUS_META.pending;
                    const visited = isVisited(i);
                    const isCurrent = !isCancelled && i === currentIdx;
                    const isCancelledCurrent = isCancelled && key === "cancelled";

                    const ring = isCancelledCurrent
                        ? "ring-rose-500"
                        : isCurrent
                            ? meta.ring
                            : visited
                                ? "ring-emerald-500"
                                : "ring-gray-300";

                    const node = isCancelledCurrent
                        ? "bg-rose-50 text-rose-700"
                        : isCurrent
                            ? meta.node
                            : visited
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-300";

                    const Icon = meta.icon;

                    return (
                        <Fragment key={`${key}-${i}`}>
                            {/* Node */}
                            <div className="flex flex-col items-center">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ${ring} ${node}`}>
                                    {/* Always show the step's icon; future steps are gray-200 */}
                                    <Icon className={`h-4 w-4 ${visited || isCurrent || isCancelledCurrent ? "" : "text-gray-200"}`} />
                                </div>
                                <div className="mt-2 text-xs font-medium text-gray-700">{meta.label}</div>
                            </div>

                            {/* Segment (between this node and the next) */}
                            {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${segmentColor(i)}`} />}
                        </Fragment>
                    );
                })}
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
        <section className="bg-white ">
            <div className="max-w-4xl mx-auto py-2">
                <div className="py-1">
                    <Link to="../appointments" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary">
                        <ChevronLeft className="h-4 w-4" /> Back to appointments
                    </Link>
                </div>

                {/* Removed overflow-hidden so dropdown isn't clipped */}
                <div className="mt-3 border  border-gray-200 rounded-xl">
                    {/* header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full grid place-items-center">
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
                </div>
            </div>
        </section>
    );
}
