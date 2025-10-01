import { format } from "date-fns";
import { useState } from "react";
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
    const [confirmMessage, setConfirmMessage] = useState("");

    /* ---------------- Handle Submit ---------------- */
    const handleFormSubmit = async (formData) => {
        try {
            await api.post("/admin/appointments", formData);

            toast.success("Appointment created successfully");
            setServerErrors({});
            onSave?.();
            onClose();
        } catch (err) {
            const { status, data } = err.response || {};

            // 🔹 Confirm Needed (outside hours, blocked, etc.)
            if (status === 409 && data?.confirmNeeded) {
                setConfirmData(formData);
                setConfirmMessage(data.message || "Do you want to continue?");
                return;
            }

            // 🔹 Validation errors (400)
            if (status === 400 && data?.errors) {
                const mapped = {};
                data.errors.forEach((msg) => {
                    if (msg.toLowerCase().includes("name")) mapped.name = msg;
                    else if (msg.toLowerCase().includes("email")) mapped.email = msg;
                    else if (msg.toLowerCase().includes("contact")) mapped.contactNumber = msg;
                    else if (msg.toLowerCase().includes("service")) mapped.service_id = msg;
                    else if (msg.toLowerCase().includes("date")) mapped.date = msg;
                    else if (msg.toLowerCase().includes("time")) mapped.time = msg;
                    else mapped.notes = msg;
                });
                setServerErrors(mapped);
                return;
            }

            // 🔹 Fallback
            toast.error(data?.message || "❌ Failed to create appointment");
        }
    };

    /* ---------------- Handle Confirm ---------------- */
    const handleConfirm = async () => {
        if (!confirmData) return;

        try {
            await api.post("/admin/appointments", { ...confirmData, override: true });

            toast.success("✅ Appointment created (override)");
            setConfirmData(null);
            onSave?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "❌ Failed to override appointment");
        }
    };

    const handleCancelConfirm = () => {
        setConfirmData(null);
        setConfirmMessage("");
    };

    return (
        <>
            {/* Main Modal */}
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

            {/* Confirmation Modal */}
            <ConfirmDialog
                open={!!confirmData}
                title="Confirmation Required"
                message={confirmMessage}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />
        </>
    );
}
