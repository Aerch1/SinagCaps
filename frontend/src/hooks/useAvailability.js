import { useEffect, useState } from "react";
import axios from "axios";

export default function useAvailability(serviceId, date) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoading(true);

    axios
      .get(`/api/availability/${serviceId}/${date}`)
      .then((res) => {
        if (res.data.success) setSlots(res.data.slots);
      })
      .catch((err) => console.error("❌ fetch availability", err))
      .finally(() => setLoading(false));
  }, [serviceId, date]);

  return { slots, loading };
}
