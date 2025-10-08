"use client";
import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/api";
import {
    ClipboardList,
    ChevronLeft,
    Check,
    Clock,
    RefreshCcw,
    XCircle,
    MoreVertical,
} from "lucide-react";

/* ---------------- Detail Row ---------------- */
function DetailRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-6 px-6 py-5 border-b border-gray-200">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-sm font-medium text-gray-900 truncate">
                {value ?? "—"}
            </div>
        </div>
    );
}

/* ---------------- Actions Menu ---------------- */
function ActionsMenu({ disabled = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) =>
            ref.current && !ref.current.contains(e.target) && setOpen(false);
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
                className={`absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg transition origin-top-right ${open
                        ? "opacity-100 scale-100 z-50"
                        : "pointer-events-none opacity-0 scale-95"
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

/* ---------------- Status Metadata ---------------- */
const STATUS_META = {
    pending: {
        label: "Pending",
        icon: Clock,
        ring: "ring-amber-500",
        node: "bg-amber-50 text-amber-600",
    },
    approved: {
        label: "Approved",
        icon: Check,
        ring: "ring-emerald-500",
        node: "bg-emerald-50 text-emerald-700",
    },
    rescheduled: {
        label: "Rescheduled",
        icon: RefreshCcw,
        ring: "ring-rose-500",
        node: "bg-rose-50 text-rose-700",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        ring: "ring-rose-500",
        node: "bg-rose-50 text-rose-700",
    },
    completed: {
        label: "Completed",
        icon: Check,
        ring: "ring-emerald-600",
        node: "bg-emerald-600 text-white",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        ring: "ring-rose-500",
        node: "bg-rose-50 text-rose-700",
    },
};

/* ---------------- Build Steps ---------------- */
function buildSteps({ status, wasRescheduled }) {
    const base = ["pending", "approved", "completed"];

    // Insert "rescheduled" if it was updated that way
    if (wasRescheduled) {
        const idx = base.indexOf("approved");
        base.splice(idx + 1, 0, "rescheduled");
    }

    // Handle cancelled, rejected, or rescheduled states
    const lowered = status?.toLowerCase();
    if (["cancelled", "canceled", "rejected"].includes(lowered)) {
        const stopIdx = Math.max(base.indexOf("approved"), 0);
        return [...base.slice(0, stopIdx + 1), lowered];
    }

    // Archived — no step indicator
    if (lowered === "archived") return base;

    return base;
}

/* ---------------- Stepper ---------------- */
function StatusStepper({ status, wasRescheduled }) {
    const steps = useMemo(
        () => buildSteps({ status, wasRescheduled }),
        [status, wasRescheduled]
    );

    const lowered = status?.toLowerCase();
    const currentStatus =
        lowered === "archived" ? "completed" : lowered; // treat archived as completed for UI
    const currentIdx = Math.max(steps.indexOf(currentStatus), 0);
    const isVisited = (i) => i <= currentIdx;

    const segmentColor = (i) => {
        const nextKey = steps[i + 1];
        if (["rescheduled", "cancelled", "rejected"].includes(nextKey))
            return "bg-rose-500";
        return i < currentIdx ? "bg-emerald-500" : "bg-gray-200";
    };

    return (
        <div className="px-6 py-8">
            <div className="flex items-center">
                {steps.map((key, i) => {
                    const meta = STATUS_META[key];
                    if (!meta) return null;

                    const visited = isVisited(i);
                    const isCurrent = key === currentStatus;

                    const ring = isCurrent
                        ? meta.ring
                        : visited
                            ? "ring-emerald-500"
                            : "ring-gray-300";

                    const node = isCurrent
                        ? meta.node
                        : visited
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-300";

                    const Icon = meta.icon;

                    return (
                        <Fragment key={`${key}-${i}`}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 ${ring} ${node}`}
                                >
                                    <Icon
                                        className={`h-4 w-4 ${visited || isCurrent
                                                ? ""
                                                : "text-gray-200"
                                            }`}
                                    />
                                </div>
                                <div className="mt-2 text-xs font-medium text-gray-700">
                                    {meta.label}
                                </div>
                            </div>

                            {i < steps.length - 1 && (
                                <div
                                    className={`mx-2 h-0.5 flex-1 ${segmentColor(
                                        i
                                    )}`}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------------- Main Component ---------------- */
export default function AppointmentDetailPanel() {
    const { id } = useParams();
    const [appt, setAppt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointment() {
            try {
                const res = await api.get(`/appointments/${id}`);
                if (res.data.success) {
                    setAppt(res.data.appointment);
                }
            } catch (err) {
                console.error("❌ Failed to fetch appointment:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAppointment();
    }, [id]);

    if (loading) {
        return (
            <section className="bg-white">
                <div className="max-w-4xl mx-auto py-6 px-6 text-center text-gray-500">
                    Loading appointment details...
                </div>
            </section>
        );
    }

    if (!appt) {
        return (
            <section className="bg-white">
                <div className="max-w-4xl mx-auto py-6 px-6">
                    <Link
                        to="../appointments"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to appointments
                    </Link>
                    <div className="mt-6 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                        Appointment not found.
                    </div>
                </div>
            </section>
        );
    }

    const datePretty = new Date(appt.date).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const timePretty = new Date(
        `1970-01-01T${appt.time}`
    ).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

    const status = appt.status?.toLowerCase();
    const actionsDisabled =
        ["completed", "cancelled", "archived", "rejected"].includes(status);

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="py-1">
                    <Link
                        to="../appointments"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to appointments
                    </Link>
                </div>

                <div className="mt-3 border border-gray-200 rounded-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full grid place-items-center">
                                <ClipboardList className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Appointment Details
                                </div>
                                <div className="text-xs text-gray-600">
                                    Transaction {appt.id}
                                </div>
                            </div>
                        </div>
                        <ActionsMenu disabled={actionsDisabled} />
                    </div>

                    {/* Details */}
                    <DetailRow label="Name" value={appt.name} />
                    <DetailRow
                        label="Service"
                        value={appt.serviceName || "Transaction"}
                    />
                    <DetailRow label="Date" value={datePretty} />
                    <DetailRow label="Time" value={timePretty} />
                    <DetailRow label="Transaction No." value={appt.id} />

                    {/* Stepper */}
                    <StatusStepper
                        status={appt.status}
                        wasRescheduled={appt.status === "rescheduled"}
                    />
                </div>
            </div>
        </section>
    );
}
