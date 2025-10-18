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
            console.log("Raw /all-requests response:", res.data);

            if (!res.data || !Array.isArray(res.data.requests)) {
                console.error("Response data is missing or malformed:", res.data);
                toast.error("Invalid response from server");
                setRequests([]);
                return;
            }

            // Directly use requestedDateTime from backend
            const data = res.data.requests.map((r) => ({
                requestId: r.id,
                appointmentId: r.appointmentId,
                requestedDateTime: r.requestedDateTime || "-", // already formatted
                notes: r.notes || "-",
                request_status: r.request_status || "pending",
                type: r.type || "-",
            }));

            console.log("Mapped requests ready for table:", data);
            setRequests(data);
        } catch (err) {
            console.error("Fetch requests error:", err);
            if (err.response) console.error("Server response:", err.response.data);
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
        } catch (err) {
            console.error("Approve error:", err);
            toast.error("Failed to approve request");
        }
    };

    const handleDeny = async (r) => {
        try {
            await api.patch(`/appointments/requests/${r.requestId}/deny`, { notes: "Denied by admin" });
            toast.success("Request denied");
            fetchRequests();
        } catch (err) {
            console.error("Deny error:", err);
            toast.error("Failed to deny request");
        }
    };

    const renderActions = (r) => (
        <div className="flex gap-1 justify-end flex-wrap">
            <button
                onClick={() => setViewingId(r.appointmentId)}
                className="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1"
            >
                <Eye className="h-3 w-3" /> View
            </button>

            {r.request_status === "pending" && (
                <>
                    <button
                        onClick={() => handleApprove(r)}
                        className="px-2 py-1 border rounded text-xs text-green-600 hover:bg-green-50 flex items-center gap-1"
                    >
                        <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                        onClick={() => handleDeny(r)}
                        className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50 flex items-center gap-1"
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
        <div className="space-y-4">
            <h1 className="text-xl font-bold">All User Requests (Admin)</h1>

            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                <table className="w-full text-sm table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {["Appointment ID", "Requested Date/Time", "Notes", "Type", "Status", "Actions"].map((h) => (
                                <th
                                    key={h}
                                    className="px-3 py-2 text-left text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider"
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
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        Loading…
                                    </td>
                                </motion.tr>
                            ) : paginated.length === 0 ? (
                                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No requests found.
                                    </td>
                                </motion.tr>
                            ) : (
                                paginated.map((r) => (
                                    <motion.tr key={r.requestId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td className="px-3 py-2 font-mono text-gray-600">{r.appointmentId}</td>
                                        <td className="px-3 py-2">{r.requestedDateTime}</td>
                                        <td className="px-3 py-2">{r.notes}</td>
                                        <td className="px-3 py-2 capitalize">{r.type}</td>
                                        <td className="px-3 py-2">{r.request_status}</td>
                                        <td className="px-3 py-2 text-right">{renderActions(r)}</td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-2 border-t bg-gray-50">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`px-2 py-1 border rounded ${p === page ? "bg-blue-600 text-white" : "bg-white"}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {viewingId && (
                <ViewAppointmentModal
                    isOpen={!!viewingId}
                    appointmentId={viewingId} // works with appointment_requests data
                    onClose={() => setViewingId(null)}
                />
            )}
        </div>
    );
}
