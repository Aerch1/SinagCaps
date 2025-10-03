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
    const [submitting, setSubmitting] = useState(false);

    // Clear server errors whenever modal (re)opens
    useEffect(() => {
        if (isOpen) setServerErrors({});
    }, [isOpen]);

    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        const toastId = toast.loading("⏳ Creating appointment...");
        try {
            await api.post("/admin/appointments", formData);

            toast.success("✅ Appointment created successfully", { id: toastId });
            setServerErrors({});
            onSave?.();
            onClose();
        } catch (err) {
            const { status, data } = err.response || {};

            // Handle confirmation-required response
            if (status === 409 && data?.confirmNeeded) {
                toast.dismiss(toastId);
                setConfirmData(formData);
                setConfirmMessage(data.message || "This action needs confirmation.");
                return;
            }

            // Handle validation errors
            if (status === 400 && Array.isArray(data?.errors)) {
                toast.dismiss(toastId);
                const mapped = {};
                data.errors.forEach((errObj) => {
                    if (typeof errObj === "string") {
                        mapped._general = errObj;
                    } else if (errObj.field) {
                        mapped[errObj.field] = errObj.message;
                    }
                });
                setServerErrors(mapped);
                return;
            }

            toast.error(data?.message || "❌ Failed to create appointment", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmData) return;
        setSubmitting(true);
        const toastId = toast.loading("⏳ Overriding appointment...");
        try {
            await api.post("/admin/appointments", { ...confirmData, override: true });

            toast.success("✅ Custom appointment created successfully", { id: toastId });
            setConfirmData(null);
            setConfirmMessage(null);
            onSave?.();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "❌ Failed to override appointment", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelConfirm = () => {
        if (submitting) return; // prevent closing while loading
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
                            submitting={submitting} // ✅ pass state
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
                    submitting={submitting} // ✅ disable confirm while loading
                />
            )}
        </>
    );
}
