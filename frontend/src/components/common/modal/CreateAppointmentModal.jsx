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

    const { checkConflicts } = useConflictCheck();

    useEffect(() => {
        if (isOpen) {
            setServerErrors({});
            setConfirmData(null);
            setConfirmMessage(null);
            setSubmitting(false);
        }
    }, [isOpen]);

    /* =====================================================
       HANDLE FORM SUBMIT (Step 1: pre-check conflicts)
    ===================================================== */
    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        const toastId = toast.loading("⏳ Checking schedule...");

        try {
            const found = await checkConflicts(
                formData.service_id,
                formData.date,
                formData.time
            );

            if (found.length) {
                toast.dismiss(toastId);
                setSubmitting(false); // 🧩 FIXED flicker issue
                setConfirmData(formData);

                // Format conflict times
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

                setConfirmMessage(
                    found.length === 1
                        ? `There’s another appointment scheduled around ${nearbyTimes}. Do you still want to continue?`
                        : `There are ${found.length} other appointments near these times: ${nearbyTimes}. Continue anyway?`
                );

                return; // Wait for confirmation
            }

            await createAppointment(formData, toastId);
        } catch (err) {
            handleError(err, toastId);
        }
    };

    /* =====================================================
       ACTUAL CREATE CALL (used by both normal + override)
    ===================================================== */
    const createAppointment = async (data, toastId, override = false) => {
        try {
            const res = await api.post("/admin/appointments", {
                ...data,
                override,
            });

            toast.dismiss(toastId);
            toast.success(res.data?.message || "✅ Appointment created successfully");

            setServerErrors({});
            setConfirmData(null);
            setConfirmMessage(null);
            onSave?.();
            onClose();
        } catch (err) {
            handleError(err, toastId);
        } finally {
            setSubmitting(false);
        }
    };

    /* =====================================================
       HANDLE ERROR (centralized)
    ===================================================== */
    const handleError = (err, toastId) => {
        toast.dismiss(toastId);
        setSubmitting(false);

        const { status, data } = err.response || {};

        if (status === 409 && data?.code === "TIME_CONFLICT") {
            // backend-level conflict, ask again for override
            setConfirmData(data?.formData || {});
            setConfirmMessage(data.message || "Conflict detected. Continue?");
            return;
        }

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
    };

    /* =====================================================
       CONFIRM HANDLERS
    ===================================================== */
    const handleConfirm = async () => {
        if (!confirmData) return;
        setSubmitting(true);
        const toastId = toast.loading("⏳ Creating appointment (override)...");

        await createAppointment(confirmData, toastId, true);
    };

    const handleCancelConfirm = () => {
        if (submitting) return;
        setConfirmData(null);
        setConfirmMessage(null);
    };

    /* =====================================================
       RENDER
    ===================================================== */
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

            {/* ✅ FIX: always render above modal (z-index higher) */}
            {confirmData && confirmMessage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <ConfirmDialog
                        open
                        title="Confirmation Required"
                        message={confirmMessage}
                        onConfirm={handleConfirm}
                        onCancel={handleCancelConfirm}
                        submitting={submitting}
                    />
                </div>
            )}
        </>
    );
}
