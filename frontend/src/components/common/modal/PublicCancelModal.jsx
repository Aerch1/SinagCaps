"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import api from "@/api/api";

export default function PublicCancelModal({ open, onClose, appointment = {}, onSuccess }) {
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setNotes("");
    }, [open]);

    const handleSubmit = async () => {
        if (!notes.trim()) {
            toast.error("Reason is required.");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post(`/appointments/requests/${appointment.id}/request-cancel`, { notes });
             if (res.data.success) {
                toast.success(res.data.message);
                onSuccess?.();
                onClose();
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            console.error("Cancel request error:", err);
            toast.error(err.response?.data?.message || "Failed to submit cancellation request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Request Cancellation" className="max-w-lg">
            <div className="space-y-4">
                <textarea
                    placeholder="Reason for cancellation"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm"
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
