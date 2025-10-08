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
    }
  }, [isOpen]);

  /* =======================================================
     🧩 Handle Normal Create (with pre-check)
  ======================================================= */
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    const toastId = toast.loading("⏳ Checking schedule...");

    try {
      // 1️⃣ Check for conflicts first
      const found = await checkConflicts(
        formData.service_id,
        formData.date,
        formData.time
      );

      if (found.length) {
        toast.dismiss(toastId);

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

        setConfirmData(formData);
        setConfirmMessage(
          found.length === 1
            ? `There’s another appointment around ${nearbyTimes}. Continue anyway?`
            : `There are ${found.length} other appointments nearby: ${nearbyTimes}. Continue anyway?`
        );
        return;
      }

      // 2️⃣ Proceed with creation
      const res = await api.post("/admin/appointments", formData);
      const newAppt = res.data?.appointment || null;

      toast.success("✅ Appointment created successfully", { id: toastId });
      onSave?.(newAppt);
      setServerErrors({});
      onClose();
    } catch (err) {
      toast.dismiss(toastId);
      const { status, data } = err.response || {};

      if (status === 400 && Array.isArray(data?.errors)) {
        const mapped = {};
        data.errors.forEach((e) => {
          if (typeof e === "string") mapped._general = e;
          else if (e.field) mapped[e.field] = e.message;
        });
        setServerErrors(mapped);
        return;
      }

      if (status === 409) {
        setConfirmData(formData);
        setConfirmMessage(data?.message || "Potential conflict detected. Continue?");
        return;
      }

      toast.error(data?.message || "❌ Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     🧩 Handle Confirm Override
  ======================================================= */
  const handleConfirm = async () => {
    if (!confirmData) return;
    setSubmitting(true);
    const toastId = toast.loading("⏳ Creating with override...");

    try {
      const res = await api.post("/admin/appointments", {
        ...confirmData,
        override: true,
      });
      const newAppt = res.data?.appointment || null;

      toast.success("✅ Appointment created (override)", { id: toastId });
      onSave?.(newAppt);
      setConfirmData(null);
      setConfirmMessage(null);
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

  /* =======================================================
     🧩 Render
  ======================================================= */
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
