// src/hooks/useMonthAvailability.js
import { useEffect, useState } from "react";
import axios from "axios";

export default function useMonthAvailability(serviceId, year, month) {
  const [available, setAvailable] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId || !year || !month) return;
    setLoading(true);

    axios
      .get(`/api/availability/${serviceId}/month/${year}/${month}`)
      .then((res) => {
        if (res.data.success) {
          const days = res.data.days || {};
          const availDays = [];
          const blockedDays = [];

          Object.entries(days).forEach(([date, status]) => {
            if (status === "available") availDays.push(date);
            if (status === "blocked") blockedDays.push(date);
          });

          setAvailable(availDays);
          setBlocked(blockedDays);
        }
      })
      .catch((err) => console.error("❌ fetch month availability", err))
      .finally(() => setLoading(false));
  }, [serviceId, year, month]);

  return { available, blocked, loading };
}
