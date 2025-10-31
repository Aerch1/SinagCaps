// utils/requirementsUtils.js
import api from "@/api/api";

/**
 * Fetch requirements progress for an appointment
 * @param {number} appointmentId - The appointment ID
 * @returns {Promise<{done: number, total: number, requirements: Array}>}
 */
export async function fetchRequirementsProgress(appointmentId) {
  try {
    const { data } = await api.get(
      `/admin/appointments/${appointmentId}/requirements`
    );

    if (data?.success) {
      const reqs = (data.requirements || []).map((r) => ({
        id: r.id,
        name: r.name,
        is_mandatory: !!r.is_mandatory,
        completed: !!r.completed,
      }));

      const done = reqs.filter((r) => r.completed).length;
      const total = reqs.length;

      return {
        done,
        total,
        requirements: reqs,
        allCompleted: done === total && total > 0,
        mandatoryDone: reqs
          .filter((r) => r.is_mandatory)
          .every((r) => r.completed),
      };
    }

    return { done: 0, total: 0, requirements: [], allCompleted: false };
  } catch (err) {
    console.error("❌ Failed to fetch requirements:", err);
    return { done: 0, total: 0, requirements: [], allCompleted: false };
  }
}
