"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import DatePopover from "../../ui/DatePopover";
import SlotSelector from "../../ui/SlotSelector";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import api from "@/api/api";
import { format } from "date-fns";
import { to12h } from "@/utils/availabilityUtils";

export default function RescheduleModal({
  open,
  onClose,
  appointment = {},
  onSuccess,
}) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);

  // Reset fields when modal opens
  useEffect(() => {
    if (open) {
      setNewDate("");
      setNewTime("");
      setConfirmData(null);
      setConfirmMsg(null);
    }
  }, [open]);

  const handleSubmit = async (override = false) => {
    if (!newDate || !newTime) {
      toast.error("Please select both date and time before submitting.");
      return;
    }

    try {
      setLoading(true);

      // 🧩 Call backend API
      const { data } = await api.patch(`/admin/appointments/${appointment.id}`, {
        status: "approved", // always keep approved when rescheduling
        date: newDate,
        time: newTime,
        override,
      });

      toast.success("✅ Appointment successfully rescheduled!");

      // 🧩 Pass backend flag to parent (was_rescheduled)
      onSuccess?.({
        ...appointment,
        date: newDate,
        time: newTime,
        status: "approved",
        was_rescheduled: Boolean(data.was_rescheduled),
      });

      onClose();
    } catch (err) {
      const { status, data } = err.response || {};
      const msg =
        data?.message || data?.error || "Failed to reschedule appointment.";

      // 🧩 Handle conflict errors (from backend)
      if (
        status === 409 &&
        (data?.code === "TIME_CONFLICT" ||
          data?.code === "CONFIRM_REQUIRED" ||
          data?.confirmNeeded)
      ) {
        setConfirmData({ override: true });
        setConfirmMsg(msg || "Conflict detected. Proceed anyway?");
        return;
      }

      console.error("❌ Reschedule error:", err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmData) return;
    setConfirmMsg(null);
    await handleSubmit(true); // retry with override
  };

  const handleCancelConfirm = () => {
    setConfirmMsg(null);
    setConfirmData(null);
  };

  const formatSchedule = () => {
    if (!appointment?.date || !appointment?.time) return "—";
    try {
      const datePart = format(new Date(appointment.date), "MMMM d, yyyy");
      const timePart = to12h(appointment.time);
      return `${datePart} at ${timePart}`;
    } catch {
      return `${appointment.date} at ${appointment.time}`;
    }
  };

  return (
    <>
      {/* Main Modal */}
      <Modal
        open={open}
        onClose={onClose}
        title="Reschedule Appointment"
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div className="border rounded-md bg-gray-50 p-3 text-sm text-gray-700 space-y-1.5">
            <p>
              <strong>Client:</strong> {appointment?.name || "—"}
            </p>
            <p>
              <strong>Service:</strong> {appointment?.serviceName || "—"}
            </p>
            <p>
              <strong>Current Schedule:</strong> {formatSchedule()}
            </p>
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
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Confirm Reschedule"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      {confirmMsg && (
        <ConfirmDialog
          open
          title="Schedule Conflict Detected"
          message={confirmMsg}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          submitting={loading}
        />
      )}
    </>
  );
}
