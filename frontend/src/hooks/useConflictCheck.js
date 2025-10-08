import { useState, useCallback } from "react";
import api from "@/api/api";

/**
 * useConflictCheck()
 * → Checks for existing appointments near a given time
 * Returns { checkConflicts, conflicts, hasConflicts, loading }
 */
export default function useConflictCheck() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkConflicts = useCallback(async (service_id, date, time) => {
    if (!service_id || !date || !time) return [];

    setLoading(true);
    try {
      const res = await api.get("/admin/appointments/conflicts", {
        params: { service_id, date, time },
      });

      const list = res.data?.conflicts || [];
      setConflicts(list);
      return list;
    } catch (err) {
      console.error("❌ useConflictCheck error:", err);
      setConflicts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkConflicts,
    hasConflicts: conflicts.length > 0,
    conflicts,
    loading,
  };
}
