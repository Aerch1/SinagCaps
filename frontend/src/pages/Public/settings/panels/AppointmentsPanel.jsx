// src/pages/Public/settings/panels/AppointmentsPanel.jsx
"use client";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import { DEMO_APPTS } from "./appointmentsDemo";

function pad2(n) { return String(n).padStart(2, "0"); }
function formatTime(dt) {
    return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function humanDuration(mins) {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}
function splitDate(iso) {
    const d = new Date(iso);
    return {
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: pad2(d.getDate()),
        base: d,
    };
}
function statusLabel(appt) {
    const raw = String(appt?.status ?? appt?.state ?? "").toLowerCase();
    if (raw === "rescheduled") return "Rescheduled";
    if (raw === "cancelled" || raw === "canceled") return "Cancelled";
    return null; // only show for these two
}

export default function AppointmentsPanel() {
    const navigate = useNavigate();

    const data = useMemo(
        () =>
            [...DEMO_APPTS].sort(
                (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
            ),
        []
    );

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-600">
                        <p>No appointments yet.</p>
                        <Link to="/services" className="inline-block mt-4">
                            <button className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black">
                                Make an Appointment
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.map((a) => {
                            const { dow, day, base } = splitDate(a.startsAt);
                            const end = a.endsAt
                                ? new Date(a.endsAt)
                                : a.durationM
                                    ? new Date(base.getTime() + a.durationM * 60000)
                                    : null;
                            const timeRange = end ? `${formatTime(base)} – ${formatTime(end)}` : formatTime(base);
                            const dura = end
                                ? humanDuration(Math.round((end.getTime() - base.getTime()) / 60000))
                                : humanDuration(a?.durationM);
                            const sLabel = statusLabel(a);

                            return (
                                <div
                                    key={a.id}
                                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                                >
                                    <button
                                        type="button"
                                        className="w-full text-left"
                                        onClick={() => navigate(`../appointments/${a.id}`)}
                                        aria-label={`View appointment ${a.ref || a.id}`}
                                    >
                                        {/* Desktop / tablet */}
                                        <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4">
                                            {/* Date block */}
                                            <div className="text-center border-r border-gray-200">
                                                <div className="text-xs uppercase tracking-wide text-gray-500">{dow}</div>
                                                <div className="text-2xl font-semibold text-gray-900 leading-none">{day}</div>
                                            </div>

                                            {/* Time (top) + Service (below) */}
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Clock className="h-3 w-3 text-gray-500 shrink-0" />
                                                    <span className="text-sm">
                                                        {timeRange}{" "}
                                                        {dura ? <span className="text-gray-500 font-normal">({dura})</span> : null}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-900 truncate">
                                                    {a.service || "Transaction"}
                                                </div>
                                            </div>

                                            {/* Transaction column + status indicator */}
                                            <div className="min-w-0">
                                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                    Transaction No.
                                                </div>
                                                <div className="text-sm text-gray-900">
                                                    {a.ref || a.id}
                                                    {sLabel ? (
                                                        <span className="ml-2 text-xs font-semibold text-red-600">{sLabel}</span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="hidden md:inline text-sm text-blue-600">View</span>
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>
                                        </div>

                                        {/* Mobile stacked */}
                                        <div className="sm:hidden px-4 py-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="text-center border-r pr-2 border-gray-200 ">
                                                        <div className="text-[11px] uppercase tracking-wide text-gray-500">{dow}</div>
                                                        <div className="text-xl font-semibold text-gray-900 leading-none">{day}</div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1 text-gray-700">
                                                            <Clock className="h-3 w-3 text-gray-500" />
                                                            <span className="text-xs">{timeRange}</span>
                                                        </div>
                                                        <div className="text-base font-medium text-gray-900">{a.service || "Transaction"}</div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-300" />
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600">
                                                <span className="uppercase tracking-wide text-gray-500">Txn:</span>{" "}
                                                <span className="font-medium text-gray-800">{a.ref || a.id}</span>
                                                <p> {sLabel ? (
                                                    <span className=" font-semibold text-red-600">{sLabel}</span>
                                                ) : null}</p>
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
