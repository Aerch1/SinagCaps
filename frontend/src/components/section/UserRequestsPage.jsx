"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, X, Check } from "lucide-react";
import ViewAppointmentModal from "../../components/common/modal/ViewAppointmentModal";
import toast from "react-hot-toast";
import api from "@/api/api";
import { format, parseISO, isValid } from "date-fns";

export default function UserRequestsTable() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewingId, setViewingId] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/appointments/requests/all-requests"); // admin route
            const data = res.data.requests.map((r) => {
                let displayDateTime = "-";

                if (r.type === "reschedule" && r.requestedDateTime) {
                    const parsed = parseISO(r.requestedDateTime);
                    if (isValid(parsed)) displayDateTime = format(parsed, "PP p");
                } else if (r.type === "cancel" && r.appointment?.date && r.appointment?.time) {
                    const parsed = parseISO(`${r.appointment.date}T${r.appointment.time}`);
                    if (isValid(parsed)) displayDateTime = format(parsed, "PP p");
                }

                return {
                    requestId: r.id,
                    appointmentId: r.appointmentId,
                    name: r.user?.name || "—",
                    requestedDateTime: displayDateTime,
                    notes: r.notes || "—",
                    request_status: r.request_status || "pending",
                    type: r.type || "—",
                    appointmentDetails: r.appointment || {},
                };
            });

            setRequests(data);
        } catch (err) {
            console.error(err);
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
            await api.patch(`/appointments/requests/${r.requestId}/deny`);
            toast.success("Request denied");
            fetchRequests();
        } catch (err) {
            console.error("Deny error:", err);
            toast.error("Failed to deny request");
        }
    };

    const renderActions = (r) => (
        <div className="flex gap-1 justify-end">
            <button
                onClick={() => setViewingId(r.appointmentId)}
                className="px-2 py-1 border rounded text-xs text-gray-700 hover:bg-gray-100"
            >
                <Eye className="inline h-3 w-3 mr-1" /> View
            </button>

            {r.request_status === "pending" && (
                <>
                    <button
                        onClick={() => handleApprove(r)}
                        className="px-2 py-1 border rounded text-xs text-green-600 hover:bg-green-50"
                    >
                        <Check className="inline h-3 w-3 mr-1" /> Approve
                    </button>
                    <button
                        onClick={() => handleDeny(r)}
                        className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50"
                    >
                        <X className="inline h-3 w-3 mr-1" /> Deny
                    </button>
                </>
            )}
        </div>
    );

    const paginated = requests.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(requests.length / pageSize);

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">User Requests</h1>

            <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
                <table className="w-full text-sm table-auto divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left">Appointment ID</th>
                            <th className="px-3 py-2 text-left">Client Name</th>
                            <th className="px-3 py-2 text-left">Requested Date/Time</th>
                            <th className="px-3 py-2 text-left">Notes</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <AnimatePresence>
                            {loading ? (
                                <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">Loading…</td>
                                </motion.tr>
                            ) : paginated.length === 0 ? (
                                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">No requests found.</td>
                                </motion.tr>
                            ) : (
                                paginated.map((r) => (
                                    <motion.tr key={r.requestId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <td className="px-3 py-2 font-mono text-gray-600">{r.appointmentId}</td>
                                        <td className="px-3 py-2">{r.name}</td>
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
                    appointmentId={viewingId}
                    onClose={() => setViewingId(null)}
                />
            )}
        </div>
    );
}
