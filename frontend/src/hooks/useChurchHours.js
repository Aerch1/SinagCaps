"use client";

import { useState, useEffect } from "react";
import api from "@/api/api"; // ✅ centralized axios instance

/**
 * Fetches church hours once and maps them by day_of_week
 * @returns {Object} { churchHours, loading, error }
 */
export default function useChurchHours() {
  const [churchHours, setChurchHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchHours = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/church-hours"); // ✅ no /api prefix
        if (res.data.success && active) {
          const map = {};
          res.data.hours.forEach((h) => {
            map[h.day_of_week] = {
              open_time: h.open_time,
              close_time: h.close_time,
              is_closed: !!h.is_closed,
            };
          });
          setChurchHours(map);
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHours();
    return () => {
      active = false;
    };
  }, []);

  return { churchHours, loading, error };
}
