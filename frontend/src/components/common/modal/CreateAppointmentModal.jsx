"use client";

import { format } from "date-fns";
import Modal from "../../ui/Modal";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";
import axios from "axios";
import toast from "react-hot-toast";

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave, // optional refresh callback
    selectedDate,
    fetchAvailableTimes,
}) {
    const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

    const handleFormSubmit = async (formData) => {
        try {
            const payload = {
                name: formData.name,
                email: formData.email || null,
                contactNumber: formData.contactNumber || null,
                service_id: formData.service_id, // ✅ DB column
                date: formData.date,
                time: formData.time,
                status: formData.status,
                notes: formData.notes || null,
            };

            await axios.post("/api/admin/appointments", payload, {
                withCredentials: true,
            });

            toast.success("Appointment created");
            onSave?.();
            onClose();
        } catch (err) {
            console.error("❌ create appointment failed:", err);
            toast.error("Failed to create appointment");
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Create Appointment"
            className="max-w-5xl"
        >
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="max-w-full px-2">
                    <CreateAppointmentForm
                        defaultDate={defaultDate}
                        onSubmit={handleFormSubmit}
                        onCancel={onClose}
                        fetchAvailableTimes={fetchAvailableTimes}
                    />
                </div>
            </div>
        </Modal>
    );
}
