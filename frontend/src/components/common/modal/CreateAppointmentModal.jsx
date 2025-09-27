"use client";

import { format } from "date-fns";
import Modal from "../../ui/Modal";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    selectedDate,
    fetchAvailableTimes,
}) {
    const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    const [serverErrors, setServerErrors] = useState({});

    const handleFormSubmit = async (formData) => {
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                contactNumber: formData.contactNumber,
                service_id: formData.service_id,
                date: formData.date,
                time: formData.time,
                status: formData.status,
                notes: formData.notes,
            };

            await axios.post("/api/admin/appointments", payload, {
                withCredentials: true,
            });

            toast.success("Appointment created");
            setServerErrors({});
            onSave?.();
            onClose();
        } catch (err) {
            console.error("❌ create appointment failed:", err);

            if (err.response?.data?.errors) {
                // Map backend validation errors to form fields
                const mapped = {};
                err.response.data.errors.forEach((msg) => {
                    if (msg.toLowerCase().includes("name")) mapped.clientName = msg;
                    else if (msg.toLowerCase().includes("email")) mapped.email = msg;
                    else if (msg.toLowerCase().includes("contact")) mapped.phone = msg;
                    else if (msg.toLowerCase().includes("service")) mapped.service_id = msg;
                    else if (msg.toLowerCase().includes("date")) mapped.date = msg;
                    else if (msg.toLowerCase().includes("time")) mapped.time = msg;
                    else mapped.notes = msg;
                });
                setServerErrors(mapped);
            } else {
                toast.error(err.response?.data?.message || "Failed to create appointment");
            }
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title="Create Appointment"
            className="max-w-2xl"
        >
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="max-w-full px-2">
                    <CreateAppointmentForm
                        defaultDate={defaultDate}
                        onSubmit={handleFormSubmit}
                        onCancel={onClose}
                        fetchAvailableTimes={fetchAvailableTimes}
                        serverErrors={serverErrors} // ✅ inject backend errors into form
                    />
                </div>
            </div>
        </Modal>
    );
}
