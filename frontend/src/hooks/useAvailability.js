// src/hooks/useAvailability.js
import { useEffect, useState } from "react";
import api from "@/api/api"; // centralized axios instance

const DEFAULT = {
  slots: [],
  status: "none",
  remaining: 0,
  capacity: 0,
  booked: 0,
};

export default function useAvailability(serviceId, date) {
  const [data, setData] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // reset when inputs are missing
    if (!serviceId || !date) {
      setData(DEFAULT);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);

    api
      .get(`/availability/${serviceId}/${date}`, { signal: ctrl.signal })
      .then((res) => {
        if (res?.data?.success) {
          setData({
            slots: res.data.slots || [],
            status: res.data.status ?? "none",
            remaining: res.data.remaining ?? 0,
            capacity: res.data.capacity ?? 0,
            booked: res.data.booked ?? 0,
          });
        } else {
          setData(DEFAULT);
        }
      })
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("❌ fetch availability", err);
        }
        setData(DEFAULT);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [serviceId, date]);

  return { ...data, loading };
}
