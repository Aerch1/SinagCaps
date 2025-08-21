"use client";

import { useEffect, useState } from "react";
import Modal from "../../ui/Modal";          // your Modal
import Dropdown from "../../ui/Dropdown1";      // your Dropdown wrapper

const DEFAULT_REASONS = [
  "Client requested cancellation",
  "Requirements not complete",
  "Conflict with church schedule",
  "Emergency or force majeure",
  "Other",
];

export default function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  reasons = DEFAULT_REASONS,
  initialReason = "",
}) {
  const [reason, setReason] = useState(initialReason || "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setReason(initialReason || "");
      setNote("");
    }
  }, [isOpen, initialReason]);

  function handleConfirm() {
    if (!reason) return;
    onConfirm?.({ reason, note: note.trim() || undefined });
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Cancel Appointment">
      <div
        className="max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600"
      >
        <div className="w-[600px] max-w-full space-y-4"> {/* wider layout */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Reason <span className="text-red-600">*</span>
            </label>
            <Dropdown
              value={reason}
              onChange={setReason}
              options={reasons}
              placeholder="Select a reason…"
              className="w-full"
            />
            {!reason && (
              <p className="mt-1 text-xs text-red-600">
                Please select a reason to continue.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Additional notes (optional)
            </label>
            <textarea
              rows={5}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Add context for the client / internal note…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!reason}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                reason ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
              }`}
            >
              Confirm cancel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}