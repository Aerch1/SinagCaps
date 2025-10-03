"use client";

import { useEffect, useMemo, useState } from "react";
import {
    X,
    Pencil,
    Info,
    CalendarClock,
    Clock,
    Tag,
    Mail,
    Phone,
    MapPin,
    StickyNote,
    Save,
    XCircle,
} from "lucide-react";
import api from "@/api/api";
import { formatDate, to12h } from "@/utils/availabilityUtils";
import { statusClass } from "@/lib/utils";

// ✅ Pretty labels for extra fields
function formatLabel(key) {
    const map = {
        childFullName: "Child Full Name",
        childDob: "Child Date of Birth",
        childBirthplace: "Child Birthplace",
        fatherName: "Father's Name",
        motherMaidenName: "Mother's Maiden Name",
        parentsMarriageType: "Parents' Marriage Type",
    };
    return map[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// ✅ Format field values
function formatFieldValue(key, val) {
    if (!val) return "—";
    if (key === "childDob") {
        return formatDate(val); // only date
    }
    return val;
}

export default function ViewAppointmentModal({
    isOpen,
    onClose,
    appointmentId,
    onUpdate,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [local, setLocal] = useState(null);
    const [loading, setLoading] = useState(false);

    // 🔵 Fetch appointment details
    useEffect(() => {
        if (!isOpen || !appointmentId) return;
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/admin/appointments/${appointmentId}`);
                setLocal({
                    ...res.data?.appointment,
                    details: res.data?.details || null,
                    sponsors: res.data?.sponsors || [],
                });
            } catch (err) {
                console.error("❌ Failed to fetch appointment details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [isOpen, appointmentId]);

    const initials = useMemo(() => {
        const n = String(local?.name || "").trim();
        return n
            ? n
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()
            : "??";
    }, [local?.name]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 h-screen z-[999] bg-black/40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over */}
            <aside className="fixed right-0 top-0 z-[1000] w-full max-w-2xl h-screen bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction ID</p>
                        <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                            #{local?.id || "—"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing((v) => !v)}
                            className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Edit appointment"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-sm text-gray-500">Loading appointment details…</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Client Info */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <div className="flex items-start gap-4">
                                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-semibold shrink-0 shadow-sm">
                                        {initials}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Client</p>
                                        <h3 className="text-lg font-semibold text-gray-900">{local?.name || "—"}</h3>
                                    </div>
                                </div>
                            </section>

                            {/* Appointment */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    Appointment Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Detail
                                        icon={CalendarClock}
                                        label="Date & Time"
                                        value={
                                            local?.date
                                                ? `${formatDate(local.date)} · ${to12h(local?.time)}`
                                                : "—"
                                        }
                                    />
                                    <Detail
                                        icon={Tag}
                                        label="Service"
                                        value={local?.serviceName}
                                    />
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-gray-50">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                                            <span className={statusClass(local?.status)}>
                                                {local?.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Contact */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    Contact Information
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Detail icon={Mail} label="Email" value={local?.email} />
                                        <Detail
                                            icon={Phone}
                                            label="Phone"
                                            value={local?.contactNumber}
                                        />
                                    </div>
                                    <Detail icon={MapPin} label="Address" value={local?.address} />
                                </div>
                            </section>

                            {/* Extra Fields */}
                            {local?.details && (
                                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                        Additional Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(local.details).map(([key, val]) => (
                                            <Detail
                                                key={key}
                                                icon={Info}
                                                label={formatLabel(key)}
                                                value={formatFieldValue(key, val)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Sponsors */}
                            {local?.sponsors?.length > 0 && (
                                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                                        Sponsors
                                    </h4>
                                    <div className="space-y-3">
                                        {local.sponsors.map((s, i) => (
                                            <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:shadow-sm transition-shadow">
                                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                                    <span className="text-blue-600">{s.role}:</span> {s.name}
                                                </p>
                                                {s.address && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3" />
                                                        {s.address}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Notes */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-rose-500 rounded-full"></div>
                                    Notes
                                </h4>
                                {isEditing ? (
                                    <textarea
                                        rows={4}
                                        value={local?.notes || ""}
                                        onChange={(e) =>
                                            setLocal((prev) => ({ ...prev, notes: e.target.value }))
                                        }
                                        placeholder="Add notes about this appointment..."
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                ) : (
                                    <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-gray-50 to-white">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-white shadow-sm">
                                                <StickyNote className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">
                                                {local?.notes?.trim()
                                                    ? local.notes
                                                    : <span className="text-gray-400 italic">No additional notes</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <footer className="border-t border-gray-200 px-6 py-4 bg-white flex items-center justify-between shadow-lg">
                    {!isEditing ? (
                        <>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Changes are saved automatically
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit details
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-gray-500">
                                Make your changes and save
                            </p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Discard
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        onUpdate?.(local);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save changes
                                </button>
                            </div>
                        </>
                    )}
                </footer>
            </aside>
        </>
    );
}

/* Helpers */
function Detail({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-50 shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium  text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-nowrap text-gray-900  break-words">{value || "—"}</p>
            </div>
        </div>
    );
}