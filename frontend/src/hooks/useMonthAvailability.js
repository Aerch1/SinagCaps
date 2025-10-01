// src/hooks/useMonthAvailability.js
import { useEffect, useState } from "react";
import api from "@/api/api";

export default function useMonthAvailability(serviceId, year, month) {
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId || !year || !month) return;
    setLoading(true);

    api
      .get(`/availability/${serviceId}/month/${year}/${month}`)
      .then((res) => {
        if (res.data.success) {
          setDays(res.data.days || {});
        }
      })
      .catch((err) => console.error("❌ fetch month availability", err))
      .finally(() => setLoading(false));
  }, [serviceId, year, month]);

  return { days, loading };
}
