"use client";
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "@/api/api";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";

export default function ProcessModal({ appointment, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [newReqName, setNewReqName] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [addingReq, setAddingReq] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  /* ---------------- Load Requirements ---------------- */
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/admin/appointments/${appointment.id}/requirements`
        );
        if (!active) return;

        if (data?.success) {
          const reqs = (data.requirements || []).map((r) => ({
            id: r.id,
            name: r.name,
            is_mandatory: !!r.is_mandatory,
            completed: !!r.completed,
          }));
          setRequirements(reqs);
          setNotes(data.notes || "");
          setProgress({
            done: reqs.filter((r) => r.completed).length,
            total: reqs.length,
          });
        } else toast.error("Failed to load requirements");
      } catch (err) {
        console.error("❌ load requirements error:", err);
        toast.error("Failed to load requirements");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [appointment?.id]);

  /* ---------------- Auto Update Progress ---------------- */
  useEffect(() => {
    const done = requirements.filter((r) => r.completed).length;
    const total = requirements.length;
    setProgress({ done, total });
  }, [requirements]);

  const allMandatoryDone = requirements
    .filter((r) => r.is_mandatory)
    .every((r) => r.completed);

  /* ---------------- Save Progress ---------------- */
  async function handleSaveProgress() {
    try {
      setSaving(true);
      const payload = {
        requirements: requirements.map((r) => ({
          id: r.id,
          completed: !!r.completed,
        })),
        notes,
      };
      const { data } = await api.patch(
        `/admin/appointments/${appointment.id}/requirements`,
        payload
      );

      if (data?.success) {
        toast.success("Progress saved successfully");
        onSave?.();
      } else toast.error("Failed to save progress");
    } catch (err) {
      console.error("❌ save progress error:", err);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- Mark as Completed ---------------- */
  async function handleMarkRequirementsComplete() {
    if (!allMandatoryDone) {
      toast.error("Please complete all mandatory requirements first.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        requirements: requirements.map((r) => ({
          id: r.id,
          completed: !!r.completed,
        })),
        notes,
        mark_completed: true, // flag to mark requirements done
      };
      const { data } = await api.patch(
        `/admin/appointments/${appointment.id}/requirements`,
        payload
      );

      if (data?.success) {
        toast.success("All requirements marked as completed!");
        setProgress((prev) => ({ ...prev, done: prev.total }));
        onSave?.();
      } else toast.error("Failed to update completion status");
    } catch (err) {
      console.error("❌ mark completed error:", err);
      toast.error("Failed to mark as completed");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- Add Requirement ---------------- */
  async function handleAddRequirement() {
    if (!newReqName.trim()) return toast.error("Requirement name is required");
    try {
      setAddingReq(true);
      const { data } = await api.post(`/admin/requirements`, {
        service_id: appointment.service_id,
        name: newReqName.trim(),
        is_mandatory: isMandatory,
      });

      if (data?.success && data.requirement) {
        setRequirements((prev) => [
          ...prev,
          { ...data.requirement, completed: false },
        ]);
        setNewReqName("");
        setIsMandatory(true);
        toast.success("Requirement added successfully");
      } else toast.error(data.message || "Failed to add requirement");
    } catch (err) {
      console.error("❌ add requirement error:", err);
      toast.error("Failed to add requirement");
    } finally {
      setAddingReq(false);
    }
  }

  /* ---------------- Delete Requirement ---------------- */
  async function handleDeleteRequirement(reqId) {
    try {
      const { data } = await api.delete(`/admin/requirements/${reqId}`);
      if (data?.success) {
        setRequirements((prev) => prev.filter((r) => r.id !== reqId));
        toast.success("Requirement removed");
      } else toast.error("Failed to remove requirement");
    } catch (err) {
      console.error("❌ delete requirement error:", err);
      toast.error("Failed to remove requirement");
    } finally {
      setConfirmingId(null);
    }
  }

  if (!appointment) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Process Appointment #${appointment.id}`}
    >
      {loading ? (
        <div className="p-6 text-gray-500">Loading requirements…</div>
      ) : (
        <div className="space-y-4 p-2 sm:p-4">
          {/* ✅ Progress summary */}
          <div className="text-sm font-medium text-gray-700">
            Requirements Needed:{" "}
            <span className="ml-1 text-blue-600">
              {progress.done}/{progress.total} Completed
            </span>
            {progress.total > 0 &&
              (progress.done === progress.total ? (
                <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  Completed
                </span>
              ) : (
                <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                  In Progress
                </span>
              ))}
          </div>

          {/* ✅ Checklist */}
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-2 rounded border hover:bg-gray-50"
              >
                <label className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={!!req.completed}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRequirements((prev) =>
                        prev.map((r) =>
                          r.id === req.id ? { ...r, completed: checked } : r
                        )
                      );
                    }}
                  />
                  <span className="text-sm">
                    {req.name}
                    {req.is_mandatory && (
                      <span className="ml-4 rounded-full bg-secondary px-2 py-0.5 text-xs text-white">
                        Mandatory
                      </span>
                    )}
                  </span>
                </label>

                {/* 🗑️ Trash / Confirm button */}
                {confirmingId === req.id ? (
                  <button
                    onClick={() => handleDeleteRequirement(req.id)}
                    className="p-1 rounded bg-red-600 text-white text-xs px-2"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmingId(req.id);
                      setTimeout(() => setConfirmingId(null), 3000);
                    }}
                    className="p-1 rounded hover:bg-red-100"
                    title="Delete requirement"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                )}
              </div>
            ))}

            {requirements.length === 0 && (
              <div className="text-sm text-gray-500">
                No requirements defined for this service.
              </div>
            )}

            {/* ➕ Add requirement inline */}
            <div className="flex items-center gap-2 mt-3 border-t pt-3">
              <input
                type="text"
                value={newReqName}
                onChange={(e) => setNewReqName(e.target.value)}
                placeholder="New requirement name"
                className="flex-1 rounded border p-2 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                />
                Mandatory
              </label>
              <button
                onClick={handleAddRequirement}
                disabled={!newReqName.trim() || addingReq}
                className="h-9 rounded bg-secondary px-3 text-sm text-white disabled:opacity-60"
              >
                {addingReq ? "Adding…" : "+"}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-sm font-medium text-gray-700">Notes</div>
            <textarea
              className="mt-1 w-full rounded border p-2 text-sm"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes…"
            />
          </div>
        </div>
      )}

      {/* ✅ Footer */}
      <div className="flex items-center justify-end gap-2 border-t pt-3">
        <button onClick={onClose} className="h-9 rounded border px-3 text-sm">
          Close
        </button>
        <button
          onClick={handleSaveProgress}
          disabled={saving || loading}
          className="h-9 rounded bg-blue-600 px-3 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Progress"}
        </button>
        <button
          onClick={handleMarkRequirementsComplete}
          disabled={!allMandatoryDone || saving || loading}
          className="h-9 rounded bg-green-600 px-3 text-sm text-white disabled:opacity-60"
        >
          Mark Completed
        </button>
      </div>
    </Modal>
  );
}
