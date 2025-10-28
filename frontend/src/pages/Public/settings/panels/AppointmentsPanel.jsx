"use client";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ChevronRight, FileText } from "lucide-react";
import api from "@/api/api";
import { to12h } from "@/utils/availabilityUtils";

/* ======================================================
   🔸 Helpers
====================================================== */
const pad2 = (n) => String(n).padStart(2, "0");

const splitDate = (iso) => {
    const d = new Date(iso);
    return {
        dow: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: pad2(d.getDate()),
    };
};

const statusLabel = (status, pendingRequest) => {
    if (pendingRequest === "reschedule") return "Waiting for Admin";
    if (!status) return null;
    const key = status.toLowerCase();
    const map = {
        pending: "Pending",
        approved: "Approved",
        completed: "Completed",
        rescheduled: "Rescheduled",
        cancelled: "Cancelled",
        canceled: "Cancelled",
        rejected: "Rejected",
        processing: "Waiting for Admin",
    };
    return map[key] || status;
};

const getStatusColor = (status) => {
    if (!status) return "text-gray-600";
    const key = status.toLowerCase();
    const map = {
        pending: "text-yellow-600",
        approved: "text-green-600",
        completed: "text-blue-600",
        rescheduled: "text-red-600",
        cancelled: "text-red-600",
        canceled: "text-red-600",
        rejected: "text-red-600",
        processing: "text-orange-600",
    };
    return map[key] || "text-gray-600";
};

const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

/* ======================================================
   🧾 Component
====================================================== */
export default function AppointmentsPanel() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [documentRequests, setDocumentRequests] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [loadingDocuments, setLoadingDocuments] = useState(true);

    const fetchData = async (endpoint, setData, setLoading, key) => {
        try {
            const res = await api.get(endpoint);
            if (res.data.success) {
                const list = res.data.appointments || res.data.requests || [];
                list.sort((a, b) => new Date(b[key]) - new Date(a[key]));
                setData(list);
            }
        } catch (err) {
            console.error(`❌ Failed to fetch ${endpoint}:`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData("/appointments/my", setAppointments, setLoadingAppointments, "date");
        fetchData("/public/documents/my", setDocumentRequests, setLoadingDocuments, "created_at");
    }, []);

    const renderTransactionCard = (item, isAppt) => {
        const dateValue = isAppt ? item.date : item.created_at;
        if (!dateValue) return null;

        const { dow, day } = splitDate(dateValue);
        const time = isAppt ? to12h(item.time) : "--";

        const sLabel = statusLabel(item.status, item.pendingRequest);
        const colorClass = item.pendingRequest === "reschedule"
            ? "text-orange-600 font-semibold"
            : getStatusColor(item.status);

        const isArchived = item.status?.toLowerCase() === "archived";

        // 🔹 Updated title for document requests
        const title = isAppt
            ? item.serviceName || "Transaction"
            : item.document_types?.length
                ? item.document_types.map(capitalizeFirst).join(", ")
                : "Document";

        const code = isAppt ? item.id : item.request_code;
        const navigateTo = isAppt
            ? `../appointments/${item.id}`
            : `../document-requests/${item.id}`;

        return (
            <div
                key={`${isAppt ? "appt" : "doc"}-${item.id}`}
                className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
                <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => navigate(navigateTo)}
                >
                    {/* Desktop View */}
                    <div className="hidden sm:grid grid-cols-[80px_1fr_1fr_1fr_auto] items-center gap-4 px-4 sm:px-6 py-4">
                        <div className="text-center border-r border-gray-200">
                            <div className="text-xs uppercase tracking-wide text-gray-500">{dow}</div>
                            <div className="text-2xl font-semibold text-gray-900 leading-none">{day}</div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1 text-gray-700">
                                {isAppt ? (
                                    <>
                                        <Clock className="h-3 w-3 text-gray-500 shrink-0" />
                                        <span className="text-sm">{time}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-3 w-3 text-gray-500 shrink-0" />
                                        <span className="text-sm">Document</span>
                                    </>
                                )}
                            </div>
                            <div className="mt-1 text-sm text-gray-900 truncate">{title}</div>
                        </div>

                        <div className="min-w-0">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                {isAppt ? "Transaction No." : "Request Code"}
                            </div>
                            <div className="text-sm text-gray-900">{code}</div>
                        </div>

                        <div
                            className={`min-w-0 text-sm font-semibold ${isArchived ? "invisible" : colorClass}`}
                        >
                            {sLabel}
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                            <span className="hidden md:inline text-sm text-blue-600">View</span>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="sm:hidden px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="text-center border-r pr-2 border-gray-200">
                                    <div className="text-[11px] uppercase tracking-wide text-gray-500">{dow}</div>
                                    <div className="text-xl font-semibold text-gray-900 leading-none">{day}</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 text-gray-700">
                                        {isAppt ? (
                                            <>
                                                <Clock className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs">{time}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs">Document</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-base font-medium text-gray-900">{title}</div>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>

                        <div className="mt-2 text-xs text-gray-600">
                            <span className="uppercase tracking-wide text-gray-500">
                                {isAppt ? "Txn:" : "Code:"}
                            </span>{" "}
                            <span className="font-medium text-gray-800">{code}</span>
                            {!isArchived && <p className={`font-semibold mt-1 ${colorClass}`}>{sLabel}</p>}
                        </div>
                    </div>
                </button>
            </div>
        );
    };

    const renderSection = (title, loading, data, emptyMsg, linkTo, buttonText, isAppt) => (
        <div>
            <h2 className="text-lg font-semibold mb-3">{title}</h2>
            {loading ? (
                <div className="py-10 text-center text-gray-500">
                    <p>Loading your {title.toLowerCase()}...</p>
                </div>
            ) : data.length === 0 ? (
                <div className="rounded-xl border border-gray-200 px-6 py-10 text-center text-sm text-gray-600">
                    <p>{emptyMsg}</p>
                    <Link to={linkTo} className="inline-block mt-4">
                        <button className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-black">
                            {buttonText}
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {data.map((item) => renderTransactionCard(item, isAppt))}
                </div>
            )}
        </div>
    );

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-6 space-y-10">
                {renderSection(
                    "🗓 Appointments",
                    loadingAppointments,
                    appointments,
                    "No appointments yet.",
                    "/services/appointments/terms",
                    "Make an Appointment",
                    true
                )}
                {renderSection(
                    "📄 Document Requests",
                    loadingDocuments,
                    documentRequests,
                    "No document requests yet.",
                    "/services/documents",
                    "Request a Document",
                    false
                )}
            </div>
        </section>
    );
}
