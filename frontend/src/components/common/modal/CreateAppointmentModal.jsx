// src/components/common/modal/CreateAppointmentModal.jsx
import { format } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/api/api";

import Modal from "../../ui/Modal";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";
import ConfirmDialog from "../../ui/ConfirmDialog";

export default function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    selectedDate,
}) {
    const defaultDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    const [serverErrors, setServerErrors] = useState({});
    const [confirmData, setConfirmData] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState(null);

    // Clear server errors whenever modal (re)opens
    useEffect(() => {
        if (isOpen) setServerErrors({});
    }, [isOpen]);

    const handleFormSubmit = async (formData) => {
        try {
            await api.post("/admin/appointments", formData);
            toast.success("Appointment created successfully");
            setServerErrors({});
            onSave?.();
            onClose();
        } catch (err) {
            const { status, data } = err.response || {};

            // Handle confirmation-required response
            if (status === 409 && data?.confirmNeeded) {
                setConfirmData(formData);
                setConfirmMessage(data.message || "This action needs confirmation.");
                return;
            }

            // Handle validation errors
            if (status === 400 && Array.isArray(data?.errors)) {
                const mapped = {};
                data.errors.forEach((msg) => {
                    const lower = String(msg || "").toLowerCase();
                    if (lower.includes("name")) mapped.name = msg;
                    else if (lower.includes("email")) mapped.email = msg;
                    else if (lower.includes("contact")) mapped.contactNumber = msg;
                    else if (lower.includes("service")) mapped.service_id = msg;
                    else if (lower.includes("date")) mapped.date = msg;
                    else if (lower.includes("time")) mapped.time = msg;
                    else mapped.notes = msg;
                });
                setServerErrors(mapped);
                return;
            }

            toast.error(data?.message || "❌ Failed to create appointment");
        }
    };

    const handleConfirm = async () => {
        if (!confirmData) return;
        try {
            await api.post("/admin/appointments", { ...confirmData, override: true });
            toast.success("Custom Appointment created successfully");
            setConfirmData(null);
            setConfirmMessage(null);
            onSave?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "❌ Failed to override appointment");
        }
    };

    const handleCancelConfirm = () => {
        setConfirmData(null);
        setConfirmMessage(null);
    };

    return (
        <>
            <Modal open={isOpen} onClose={onClose} title="Create Appointment" className="max-w-2xl">
                <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="max-w-full px-2">
                        <CreateAppointmentForm
                            defaultDate={defaultDate}
                            onSubmit={handleFormSubmit}
                            onCancel={onClose}
                            serverErrors={serverErrors}
                        />
                    </div>
                </div>
            </Modal>

            {confirmData && confirmMessage && (
                <ConfirmDialog
                    open
                    title="Confirmation Required"
                    message={confirmMessage}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirm}
                />
            )}
        </>
    );
}
