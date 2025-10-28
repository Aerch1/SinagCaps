"use client";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/api/api";
import {
    ClipboardList,
    ChevronLeft,
    Check,
    Clock,
    RefreshCcw,
    XCircle,
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
    rejected: {
        label: "Rejected",
        icon: XCircle,
        ring: "ring-rose-500",
        node: "bg-rose-50 text-rose-700",
    },
    processing: {
        label: "Processing",
        icon: RefreshCcw,
        ring: "ring-sky-500",
        node: "bg-sky-50 text-sky-700",
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

/* ---------------- Capitalize Helper ---------------- */
const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

/* ---------------- Main Component ---------------- */
export default function DocumentRequestDetailPanel() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await api.get(`/public/documents/my/${id}`);
                if (res.data.success) {
                    setDoc(res.data.request);
                }
            } catch (err) {
                console.error("❌ Failed to fetch document:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDocument();
    }, [id]);

    if (loading) {
        return (
            <section className="bg-white">
                <div className="max-w-4xl mx-auto py-6 px-6 text-center text-gray-500">
                    Loading document details...
                </div>
            </section>
        );
    }

    if (!doc) {
        return (
            <section className="bg-white">
                <div className="max-w-4xl mx-auto py-6 px-6">
                    <Link
                        to="../document-requests"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to document requests
                    </Link>
                    <div className="mt-6 rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-600">
                        Document request not found.
                    </div>
                </div>
            </section>
        );
    }

    // Format date
    const datePretty = new Date(doc.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Status meta
    const statusKey = doc.status?.toLowerCase();
    const statusMeta = STATUS_META[statusKey];

    // Handle multiple document types
    const docTypesDisplay = Array.isArray(doc.document_types) && doc.document_types.length
        ? doc.document_types.map(capitalizeFirst).join(", ")
        : "—";

    return (
        <section className="bg-white">
            <div className="max-w-4xl mx-auto py-2">
                <div className="flex justify-center py-6">
                    <Link
                        to="../document-requests"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-secondary"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to document requests
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
                                    Document Request Details
                                </div>
                                <div className="text-xs text-gray-600">
                                    Request Code: {doc.request_code}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <DetailRow
                        label="Document Type(s)"
                        value={docTypesDisplay}
                    />
                    <DetailRow label="Purpose" value={doc.purpose} />
                    <DetailRow label="Copies" value={doc.copies} />
                    <DetailRow label="Additional Info" value={doc.additional_info} />
                    <DetailRow label="Date Requested" value={datePretty} />
                    <DetailRow label="Status" value={statusMeta?.label ?? "—"} />

                    {/* Status Indicator */}
                    {statusMeta && (
                        <div className="flex items-center justify-center gap-3 py-8">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 ${statusMeta.ring} ${statusMeta.node}`}
                            >
                                <statusMeta.icon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-800">
                                {statusMeta.label}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
