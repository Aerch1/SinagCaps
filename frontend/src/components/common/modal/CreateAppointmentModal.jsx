// src/components/common/modal/CreateAppointmentModal.jsx
"use client";

import { format, parse } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/api/api";
import Modal from "../../ui/Modal";
import CreateAppointmentForm from "../../../forms/CreateAppointmentForm";
import ConfirmDialog from "../../ui/ConfirmDialog";
import useConflictCheck from "@/hooks/useConflictCheck";

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

    // ✅ Conflict checker hook
    const { checkConflicts } = useConflictCheck();

    // Reset errors when modal opens
    useEffect(() => {
        if (isOpen) setServerErrors({});
    }, [isOpen]);

    /* ----------------------------------------------------------------
       FORM SUBMIT HANDLER — includes conflict pre-check
    ---------------------------------------------------------------- */
    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        const toastId = toast.loading("⏳ Checking schedule...");

        try {
            // ✅ 1. Check for time conflicts before creating appointment
            const found = await checkConflicts(
                formData.service_id,
                formData.date,
                formData.time
            );

            if (found.length) {
                toast.dismiss(toastId);
                setConfirmData(formData);

                // 🕒 Format times like “8:30 AM, 9:00 AM”
                const nearbyTimes = found
                    .map((c) => {
                        try {
                            const parsed = parse(c.time, "HH:mm:ss", new Date());
                            return format(parsed, "h:mm a");
                        } catch {
                            return c.time;
                        }
                    })
                    .join(", ");

                // 🗣️ Natural, human-friendly message
                setConfirmMessage(
                    found.length === 1
                        ? `There’s another appointment scheduled around ${nearbyTimes}. Do you still want to continue?`
                        : `There are ${found.length} other appointments near these times: ${nearbyTimes}. Do you still want to continue?`
                );

                return;
            }

            // ✅ 2. Proceed normally if no conflicts
            await api.post("/admin/appointments", formData);
            toast.success("✅ Appointment created successfully", { id: toastId });
            setServerErrors({});
            onSave?.();
            onClose();
        } catch (err) {
            const { status, data } = err.response || {};
            toast.dismiss(toastId);

            // 🔸 409 conflict that requires confirmation (e.g. override)
            if (status === 409 && data?.confirmNeeded) {
                setConfirmData(formData);
                setConfirmMessage(data.message || "This action needs confirmation.");
                return;
            }

            // 🔸 Validation errors
            if (status === 400 && Array.isArray(data?.errors)) {
                const mapped = {};
                data.errors.forEach((e) => {
                    if (typeof e === "string") mapped._general = e;
                    else if (e.field) mapped[e.field] = e.message;
                });
                setServerErrors(mapped);
                return;
            }

            toast.error(data?.message || "❌ Failed to create appointment");
        } finally {
            setSubmitting(false);
        }
    };

    /* ----------------------------------------------------------------
       CONFIRMATION HANDLERS
    ---------------------------------------------------------------- */
    const handleConfirm = async () => {
        if (!confirmData) return;
        setSubmitting(true);
        const toastId = toast.loading("⏳ Creating with override...");

        try {
            await api.post("/admin/appointments", {
                ...confirmData,
                override: true,
            });
            toast.success("✅ Appointment created with override", { id: toastId });
            setConfirmData(null);
            setConfirmMessage(null);
            onSave?.();
            onClose();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "❌ Failed to override appointment",
                { id: toastId }
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelConfirm = () => {
        if (submitting) return;
        setConfirmData(null);
        setConfirmMessage(null);
    };

    /* ----------------------------------------------------------------
       RENDER
    ---------------------------------------------------------------- */
    return (
        <>
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
                            serverErrors={serverErrors}
                            submitting={submitting}
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
                    submitting={submitting}
                />
            )}
        </>
    );
}
