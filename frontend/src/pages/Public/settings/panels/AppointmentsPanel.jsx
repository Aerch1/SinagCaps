"use client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import api from "@/api/api";
import { to12h } from "@/utils/availabilityUtils";

/* ---------- Helpers ---------- */
function pad2(n) {
    return String(n).padStart(2, "0");
}
function splitDate(iso) {
    const d = new Date(iso);
    return {
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: pad2(d.getDate()),
        base: d,
    };
}

/* ---------- Status Label ---------- */
function statusLabel(appt) {
    const raw = String(appt?.status ?? "").toLowerCase();
    switch (raw) {
        case "pending":
            return "Pending";
        case "approved":
            return "Approved";
        case "completed":
            return "Completed";
        case "rescheduled":
            return "Rescheduled";
        case "cancelled":
        case "canceled":
            return "Cancelled";
        case "rejected":
            return "Rejected";
        case "archived":
            return ""; // ✅ keep in list but hide label
        default:
            return null; // unknown → skip status
    }
}

/* ---------- Main Component ---------- */
export default function AppointmentsPanel() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                const res = await api.get("/appointments/my");
                if (res.data.success) {
                    setAppointments(res.data.appointments || []);
                }
            } catch (err) {
                console.error("❌ Failed to fetch appointments:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAppointments();
    }, []);

    if (loading) {
        return (
            <div className="py-10 text-center text-gray-500">
                <p>Loading your appointments...</p>
            </div>
        );
    }

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                {appointments.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-600">
                        <p>No appointments yet.</p>
                        <Link to="/services/appointments/terms" className="inline-block mt-4">
                            <button className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black">
                                Make an Appointment
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((a) => {
                            const { dow, day } = splitDate(a.date);
                            const time = to12h(a.time);
                            const sLabel = statusLabel(a);

                            // Don't skip archived; just hide its status
                            const colorClass = (() => {
                                switch (sLabel) {
                                    case "Pending":
                                        return "text-yellow-600";
                                    case "Approved":
                                        return "text-green-600";
                                    case "Completed":
                                        return "text-blue-600";
                                    case "Cancelled":
                                    case "Rejected":
                                    case "Rescheduled":
                                        return "text-red-600";
                                    default:
                                        return "text-gray-600";
                                }
                            })();

                            return (
                                <div
                                    key={a.id}
                                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                                >
                                    <button
                                        type="button"
                                        className="w-full text-left"
                                        onClick={() => navigate(`../appointments/${a.id}`)}
                                        aria-label={`View appointment ${a.id}`}
                                    >
                                        {/* Desktop / Tablet */}
                                        <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4">
                                            {/* Date */}
                                            <div className="text-center border-r border-gray-200">
                                                <div className="text-xs uppercase tracking-wide text-gray-500">
                                                    {dow}
                                                </div>
                                                <div className="text-2xl font-semibold text-gray-900 leading-none">
                                                    {day}
                                                </div>
                                            </div>

                                            {/* Time + Service */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Clock className="h-3 w-3 text-gray-500 shrink-0" />
                                                    <span className="text-sm">{time}</span>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-900 truncate">
                                                    {a.serviceName || "Transaction"}
                                                </div>
                                            </div>

                                            {/* Transaction No. */}
                                            <div className="min-w-0">
                                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                    Transaction No.
                                                </div>
                                                <div className="text-sm text-gray-900">{a.id}</div>
                                            </div>

                                            {/* Status (hidden if archived) */}
                                            <div
                                                className={`min-w-0 text-sm font-semibold ${a.status?.toLowerCase() === "archived"
                                                    ? "invisible" // ✅ hide but preserve layout
                                                    : colorClass
                                                    }`}
                                            >
                                                {sLabel}
                                            </div>

                                            {/* View Action */}
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="hidden md:inline text-sm text-blue-600">
                                                    View
                                                </span>
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>
                                        </div>

                                        {/* Mobile layout */}
                                        <div className="sm:hidden px-4 py-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="text-center border-r pr-2 border-gray-200">
                                                        <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                            {dow}
                                                        </div>
                                                        <div className="text-xl font-semibold text-gray-900 leading-none">
                                                            {day}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1 text-gray-700">
                                                            <Clock className="h-3 w-3 text-gray-500" />
                                                            <span className="text-xs">{time}</span>
                                                        </div>
                                                        <div className="text-base font-medium text-gray-900">
                                                            {a.serviceName || "Transaction"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>

                                            <div className="mt-2 text-xs text-gray-600">
                                                <span className="uppercase tracking-wide text-gray-500">
                                                    Txn:
                                                </span>{" "}
                                                <span className="font-medium text-gray-800">{a.id}</span>
                                                {a.status?.toLowerCase() !== "archived" && (
                                                    <p className={`font-semibold mt-1 ${colorClass}`}>
                                                        {sLabel}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
