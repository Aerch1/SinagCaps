// src/hooks/useMonthAvailability.js
import { useEffect, useState } from "react";
import api from "@/api/api";

export default function useMonthAvailability(serviceId, year, month) {
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceId || !year || !month) {
      setDays({});
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    let retries = 0;

    const fetchAvailability = () => {
      setLoading(true);
      setError(null);

      api
        .get(`/availability/${serviceId}/month/${year}/${month}`, {
          signal: ctrl.signal,
        })
        .then((res) => {
          if (res?.data?.success) {
            setDays(res.data.days || {});
          } else {
            setDays({});
            setError("Failed to fetch availability.");
          }
        })
        .catch((err) => {
          if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
            // Retry once on network/server failure
            if (retries < 1) {
              retries++;
              setTimeout(fetchAvailability, 500); // retry after 0.5s
            } else {
              setError("Error fetching availability.");
              setDays({});
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchAvailability();

    return () => ctrl.abort();
  }, [serviceId, year, month]);

  return { days, loading, error };
}
