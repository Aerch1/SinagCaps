"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import DatePopover from "../../ui/DatePopover";
import SlotSelector from "../../ui/SlotSelector";
import toast from "react-hot-toast";
import api from "@/api/api";
import { format } from "date-fns";
import { to12h } from "@/utils/availabilityUtils";

export default function PublicRescheduleModal({ open, onClose, appointment = {}, onSuccess }) {
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // Reset fields when modal opens
    useEffect(() => {
        if (open) {
            setNewDate("");
            setNewTime("");
            setNotes("");
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!newDate || !newTime || !notes.trim()) {
            toast.error("Please fill in all fields before submitting.");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post(`/appointments/requests/${appointment.id}/request-reschedule`, {
                requested_date: newDate,
                requested_time: newTime,
                notes,
            });

            if (res.data.success) {
                toast.success(res.data.message);
                onSuccess?.();
                onClose();
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            console.error("Reschedule request error:", err);
            toast.error(err.response?.data?.message || "Failed to submit reschedule request.");
        } finally {
            setLoading(false);
        }
    };

    const formatSchedule = () => {
        if (!appointment?.date || !appointment?.time) return "—";
        try {
            return `${format(new Date(appointment.date), "MMMM d, yyyy")} at ${to12h(appointment.time)}`;
        } catch {
            return `${appointment.date} at ${appointment.time}`;
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Request Reschedule" className="max-w-lg">
            <div className="space-y-5">
                <div className="border rounded-md bg-gray-50 p-3 text-sm text-gray-700 space-y-1.5">
                    <p><strong>Client:</strong> {appointment?.name || "—"}</p>
                    <p><strong>Service:</strong> {appointment?.serviceName || "—"}</p>
                    <p><strong>Current Schedule:</strong> {formatSchedule()}</p>
                </div>

                {/* Date Selector */}
                <DatePopover
                    label="Select New Date"
                    value={newDate}
                    onChange={setNewDate}
                    serviceId={appointment?.service_id}
                />

                {/* Slot Selector */}
                <SlotSelector
                    label="Select New Time"
                    value={newTime}
                    onChange={setNewTime}
                    serviceId={appointment?.service_id}
                    date={newDate}
                />

                {/* Notes */}
                <textarea
                    placeholder="Reason for rescheduling"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-md p-2 text-sm"
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
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
                        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
