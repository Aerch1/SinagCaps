"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, X, Check } from "lucide-react";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import toast from "react-hot-toast";
import api from "@/api/api";

export default function AdminUserRequestsTable() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewingId, setViewingId] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/appointments/requests/all-requests");

            if (!res.data || !Array.isArray(res.data.requests)) {
                toast.error("Invalid response from server");
                setRequests([]);
                return;
            }

            const data = res.data.requests.map((r) => ({
                requestId: r.id,
                appointmentId: r.appointmentId,
                clientName: r.clientName || "-",
                requestedDateTime: r.requestedDateTime || "-",
                notes: r.notes || "-",
                request_status: r.request_status || "pending",
                type: r.type || "-",
            }));

            setRequests(data);
        } catch (err) {
            console.error("Fetch requests error:", err);
            toast.error("Failed to load user requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
        const handleNewRequest = () => fetchRequests();
        window.addEventListener("userRequestSubmitted", handleNewRequest);
        return () => window.removeEventListener("userRequestSubmitted", handleNewRequest);
    }, [fetchRequests]);

    const handleApprove = async (r) => {
        try {
            await api.patch(`/appointments/requests/${r.requestId}/approve`);
            toast.success("Request approved");
            fetchRequests();
        } catch {
            toast.error("Failed to approve request");
        }
    };

    const handleDeny = async (r) => {
        try {
            await api.patch(`/appointments/requests/${r.requestId}/deny`, { notes: "Denied by admin" });
            toast.success("Request denied");
            fetchRequests();
        } catch {
            toast.error("Failed to deny request");
        }
    };

    const renderActions = (r) => (
        <div className="flex gap-1 justify-end flex-wrap">
            <button
                onClick={() => setViewingId(r.appointmentId)}
                className="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1 whitespace-nowrap"
            >
                <Eye className="h-3 w-3" /> View
            </button>

            {r.request_status === "pending" && (
                <>
                    <button
                        onClick={() => handleApprove(r)}
                        className="px-2 py-1 border rounded text-xs text-green-600 hover:bg-green-50 flex items-center gap-1 whitespace-nowrap"
                    >
                        <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                        onClick={() => handleDeny(r)}
                        className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50 flex items-center gap-1 whitespace-nowrap"
                    >
                        <X className="h-3 w-3" /> Deny
                    </button>
                </>
            )}
        </div>
    );

    const paginated = requests.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(requests.length / pageSize);

    return (
        <div className="space-y-4 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                <table className="w-full text-sm table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Appointment ID", "Client Name", "Requested Date/Time", "Notes", "Type", "Actions"].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <AnimatePresence>
                            {loading ? (
                                <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={6} className="py-12 px-4 text-center text-gray-500">Loading…</td>
                                </motion.tr>
                            ) : paginated.length === 0 ? (
                                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={6} className="py-12 px-4 text-center text-gray-500">No requests found.</td>
                                </motion.tr>
                            ) : (
                                paginated.map((r) => (
                                    <motion.tr key={r.requestId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 font-mono text-gray-600 whitespace-nowrap">{r.appointmentId}</td>
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{r.clientName}</td>
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">{r.requestedDateTime}</td>
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 max-w-xs truncate" title={r.notes}>{r.notes}</td>
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 capitalize whitespace-nowrap">{r.type}</td>
                                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-right whitespace-nowrap">{renderActions(r)}</td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-3 px-4 sm:py-4 border-t bg-gray-50">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-white transition-colors"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`px-3 py-1.5 border rounded transition-colors ${p === page ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-100"}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 border rounded disabled:opacity-50 hover:bg-white transition-colors"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {viewingId && (
                <ViewAppointmentModal
                    isOpen={!!viewingId}
                    appointmentId={viewingId}
                    onClose={() => setViewingId(null)}
                />
            )}
        </div>
    );
}