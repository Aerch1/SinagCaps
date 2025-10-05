// src/components/common/ProcessModal.jsx
import React, { useEffect, useState } from "react";
import api from "@/api/api";
import toast from "react-hot-toast";

export default function ProcessModal({ appointment, onClose, onSave, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // 🔵 Fetch requirements + notes
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get(`/admin/appointments/${appointment.id}/requirements`);
        if (!active) return;

        if (data?.success) {
          const reqs = (data.requirements || []).map(r => ({
            id: r.id,
            name: r.name,
            is_mandatory: !!r.is_mandatory,
            completed: !!r.completed,
          }));
          setRequirements(reqs);
          setNotes(data.notes || "");
          setProgress({
            done: reqs.filter(r => r.completed).length,
            total: reqs.length,
          });
        } else {
          toast.error("Failed to load requirements");
        }
      } catch (err) {
        console.error("❌ load requirements error:", err);
        toast.error(err?.response?.data?.message || "Failed to load requirements");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [appointment?.id]);

  const allMandatoryDone = requirements
    .filter(r => r.is_mandatory)
    .every(r => r.completed);

  /* ✅ Save Progress */
  async function handleSaveProgress() {
    try {
      setSaving(true);
      const payload = {
        requirements: requirements.map(r => ({
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
        const done = requirements.filter(r => r.completed).length;
        const total = requirements.length;
        setProgress({ done, total });

        toast.success("Progress saved");
        onSave?.();
      } else {
        toast.error("Failed to save progress");
      }
    } catch (err) {
      console.error("❌ save progress error:", err);
      toast.error(err?.response?.data?.message || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  }

  /* ✅ Mark as Completed */
  async function handleMarkCompleted() {
    if (!allMandatoryDone) {
      toast.error("Please complete all mandatory requirements first.");
      return;
    }
    try {
      setSaving(true);
      const { data } = await api.patch(
        `/admin/appointments/${appointment.id}/complete`
      );

      if (data?.success) {
        toast.success("Appointment marked as completed");
        onComplete?.();
      } else {
        toast.error("Failed to complete appointment");
      }
    } catch (err) {
      console.error("❌ complete appointment error:", err);
      toast.error(err?.response?.data?.message || "Failed to complete appointment");
    } finally {
      setSaving(false);
    }
  }

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold">
            Process Appointment #{appointment.id}
          </h3>
          <button onClick={onClose} className="h-8 w-8 rounded hover:bg-gray-100">✕</button>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Loading requirements…</div>
        ) : (
          <div className="space-y-4 p-4">
            {/* ✅ Progress summary */}
            <div className="text-sm font-medium text-gray-700">
              Requirements Needed:{" "}
              <span className="ml-1 text-blue-600">
                {progress.done}/{progress.total} Completed
              </span>
              {progress.total > 0 && (
                progress.done === progress.total ? (
                  <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Completed
                  </span>
                ) : (
                  <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                    In Progress
                  </span>
                )
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              {requirements.map((req) => (
                <label
                  key={req.id}
                  className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={!!req.completed}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setRequirements(prev =>
                        prev.map(r =>
                          r.id === req.id ? { ...r, completed: checked } : r
                        )
                      );
                    }}
                  />
                  <span className="text-sm">
                    {req.name}
                    {req.is_mandatory && (
                      <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Mandatory
                      </span>
                    )}
                  </span>
                </label>
              ))}
              {requirements.length === 0 && (
                <div className="text-sm text-gray-500">
                  No requirements defined for this service.
                </div>
              )}
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

        {/* Footer */}
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
            onClick={handleMarkCompleted}
            disabled={!allMandatoryDone || saving || loading}
            className="h-9 rounded bg-green-600 px-3 text-sm text-white disabled:opacity-60"
          >
            Mark Completed
          </button>
        </div>
      </div>
    </div>
  );
}
