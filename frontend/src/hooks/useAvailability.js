import { useEffect, useState } from "react";
import api from "@/api/api"; // ✅ centralized axios instance

export default function useAvailability(serviceId, date) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoading(true);

    api
      .get(`/availability/${serviceId}/${date}`) // ✅ no "/api" prefix needed
      .then((res) => {
        if (res.data.success) setSlots(res.data.slots);
      })
      .catch((err) => console.error("❌ fetch availability", err))
      .finally(() => setLoading(false));
  }, [serviceId, date]);

  return { slots, loading };
}
