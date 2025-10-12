"use client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight, FileText } from "lucide-react";
import api from "@/api/api";
import { to12h } from "@/utils/availabilityUtils";

/* ================================
   🧰 Helpers
================================ */
const pad2 = (n) => String(n).padStart(2, "0");

const splitDate = (iso) => {
    const d = new Date(iso);
    return {
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: pad2(d.getDate()),
    };
};

const statusLabel = (status) => {
    switch ((status || "").toLowerCase()) {
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
        case "processing":
            return "Processing";
        case "archived":
            return "";
        default:
            return null;
    }
};

const statusColor = (label) => {
    switch (label) {
        case "Pending":
            return "text-yellow-600";
        case "Approved":
            return "text-green-600";
        case "Completed":
            return "text-blue-600";
        case "Cancelled":
        case "Rejected":
        case "Rescheduled":
        case "Processing":
            return "text-red-600";
        default:
            return "text-gray-600";
    }
};

/* ================================
   🧾 Component
================================ */
export default function AppointmentsPanel() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [documentRequests, setDocumentRequests] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [loadingDocuments, setLoadingDocuments] = useState(true);

    /* ---------- Fetch Appointments ---------- */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/appointments/my");
                if (data.success) {
                    const sorted = [...(data.appointments || [])].sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                    );
                    setAppointments(sorted);
                }
            } catch (err) {
                console.error("❌ Failed to fetch appointments:", err);
            } finally {
                setLoadingAppointments(false);
            }
        })();
    }, []);

    /* ---------- Fetch Document Requests ---------- */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/public/documents/my");
                if (data.success) {
                    const sorted = [...(data.requests || [])].sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    setDocumentRequests(sorted);
                }
            } catch (err) {
                console.error("❌ Failed to fetch document requests:", err);
            } finally {
                setLoadingDocuments(false);
            }
        })();
    }, []);

    /* ---------- Reusable Card Renderer ---------- */
    const renderTransactionCard = (item, isAppt) => {
        const dateValue = isAppt ? item.date : item.created_at;
        const { dow, day } = splitDate(dateValue);
        const label = statusLabel(item.status);
        const color = statusColor(label);

        return (
            <div
                key={`${isAppt ? "appt" : "doc"}-${item.id}`}
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
                <button
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                        navigate(
                            isAppt
                                ? `../appointments/${item.id}`
                                : `../document-requests/${item.id}`
                        )
                    }
                >
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4">
                        <div className="text-center border-r border-gray-200">
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                                {dow}
                            </div>
                            <div className="text-2xl font-semibold text-gray-900 leading-none">
                                {day}
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1 text-gray-700">
                                {isAppt ? (
                                    <>
                                        <Clock className="h-3 w-3 text-gray-500 shrink-0" />
                                        <span className="text-sm">{to12h(item.time)}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-3 w-3 text-gray-500 shrink-0" />
                                        <span className="text-sm">Document</span>
                                    </>
                                )}
                            </div>
                            <div className="mt-1 text-sm text-gray-900 truncate">
                                {isAppt ? item.serviceName || "Transaction" : item.document_type}
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                {isAppt ? "Transaction No." : "Request Code"}
                            </div>
                            <div className="text-sm text-gray-900">
                                {isAppt ? item.id : item.request_code}
                            </div>
                        </div>

                        <div
                            className={`min-w-0 text-sm font-semibold ${item.status?.toLowerCase() === "archived" ? "invisible" : color
                                }`}
                        >
                            {label}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <span className="hidden md:inline text-sm text-blue-600">
                                View
                            </span>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>
                    </div>

                    {/* Mobile */}
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
                                        {isAppt ? (
                                            <>
                                                <Clock className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs">{to12h(item.time)}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs">Document</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-base font-medium text-gray-900">
                                        {isAppt
                                            ? item.serviceName || "Transaction"
                                            : item.document_type}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>

                        <div className="mt-2 text-xs text-gray-600">
                            <span className="uppercase tracking-wide text-gray-500">
                                {isAppt ? "Txn:" : "Code:"}
                            </span>{" "}
                            <span className="font-medium text-gray-800">
                                {isAppt ? item.id : item.request_code}
                            </span>
                            {item.status?.toLowerCase() !== "archived" && (
                                <p className={`font-semibold mt-1 ${color}`}>{label}</p>
                            )}
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    /* ================================
       🧾 UI
    ================================ */
    const Section = ({ title, loading, items, emptyText, emptyLink }) => (
        <div>
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            {loading ? (
                <div className="py-10 text-center text-gray-500">
                    <p>Loading your {title.toLowerCase()}...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-600">
                    <p>{emptyText}</p>
                    {emptyLink && (
                        <Link to={emptyLink} className="inline-block mt-4">
                            <button className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black">
                                {title.includes("Appointment")
                                    ? "Make an Appointment"
                                    : "Request a Document"}
                            </button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {items.map((item) =>
                        renderTransactionCard(item, title.includes("Appointment"))
                    )}
                </div>
            )}
        </div>
    );

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-6 space-y-10">
                <Section
                    title="🗓 Appointments"
                    loading={loadingAppointments}
                    items={appointments}
                    emptyText="No appointments yet."
                    emptyLink="/services/appointments/terms"
                />
                <Section
                    title="📄 Document Requests"
                    loading={loadingDocuments}
                    items={documentRequests}
                    emptyText="No document requests yet."
                    emptyLink="/services/documents"
                />
            </div>
        </section>
    );
}
