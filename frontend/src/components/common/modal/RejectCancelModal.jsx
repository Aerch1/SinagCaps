"use client";
import { useState, useEffect } from "react";
import Dropdown1 from "@/components/ui/Dropdown1";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import api from "@/api/api";

// ✅ Helper: Convert 24-hour → 12-hour format
function to12Hour(timeStr = "") {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function RejectCancelModal({
  open,
  onClose,
  type = "reject", // or "cancel"
  appointment = {},
  onSuccess,
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Automatically clear fields when opening modal
  useEffect(() => {
    if (open) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [open]);

  const REASONS =
    type === "reject"
      ? [
          "Incomplete information",
          "Invalid documents",
          "Duplicate booking",
          "Outside schedule availability",
          "Other",
        ]
      : [
          "Client request",
          "Emergency / church event",
          "Double booking detected",
          "Service unavailable on date",
          "Other",
        ];

  const handleSubmit = async () => {
    const finalReason =
      selectedReason === "Other"
        ? customReason.trim()
        : customReason.trim() || selectedReason;

    if (!finalReason) {
      toast.error("Please provide or select a reason before submitting.");
      return;
    }

    if (!appointment?.id) {
      toast.error("Missing appointment information.");
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/admin/appointments/${appointment.id}`, {
        status: type === "reject" ? "rejected" : "cancelled",
        notes: finalReason,
        service_id: appointment.service_id,
        name: appointment.name,
        email: appointment.email,
        date: appointment.date,
        time: appointment.time,
        contactNumber: appointment.contactNumber,
        address: appointment.address,
      });

      toast.success(
        `Appointment ${
          type === "reject" ? "rejected" : "cancelled"
        } successfully`
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(`❌ Failed to ${type}:`, err);
      toast.error(`Failed to ${type} appointment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        type === "reject"
          ? "Reject Appointment Confirmation"
          : "Cancel Appointment Confirmation"
      }
    >
      <div className="space-y-4">
        {/* Info preview */}
        <div className="border rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            <strong>Client:</strong> {appointment?.name || "—"}
          </p>
          <p>
            <strong>Service:</strong> {appointment?.serviceName || "—"}
          </p>
          <p>
            <strong>Date:</strong> {appointment?.date || "—"} &nbsp;
            <strong>Time:</strong> {to12Hour(appointment?.time)}
          </p>
          <p>
            <strong>Email:</strong> {appointment?.email || "—"}
          </p>
        </div>

        {/* Dropdown first (wider) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Preset Reason
          </label>
          <Dropdown1
            label="Choose reason"
            options={REASONS}
            value={selectedReason}
            onChange={setSelectedReason}
            width="w-72"
            className="text-sm"
          />
        </div>

        {/* Textarea below */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specify Other / Additional Details
          </label>
          <textarea
            placeholder="Enter your reason here..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm p-2.5 min-h-[100px] resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-md text-white ${
              type === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            } disabled:opacity-50`}
          >
            {loading
              ? "Processing..."
              : type === "reject"
              ? "Confirm Reject"
              : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
