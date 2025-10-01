import { addMinutes } from "date-fns";

// ✅ Normalize to HH:mm (e.g. "08:00:00" → "08:00")
function normalizeToHHMM(str) {
  if (!str) return null;
  if (str.length === 8) return str.slice(0, 5); // trim seconds
  return str; // already "HH:mm"
}

export function generateSlots({
  rules,
  appointments,
  churchOpen,
  churchClose,
}) {
  const slots = [];
  const apptCount = {};

  // count appointments by time (pending + approved + in_progress only)
  appointments.forEach((a) => {
    const key = normalizeToHHMM(a.time);
    apptCount[key] = (apptCount[key] || 0) + 1;
  });

  // helper: expand range into times
  const expandRange = (start, end, step) => {
    const result = [];
    let [sh, sm] = normalizeToHHMM(start).split(":").map(Number);
    let [eh, em] = normalizeToHHMM(end).split(":").map(Number);
    let cur = new Date(2000, 0, 1, sh, sm);
    let endDate = new Date(2000, 0, 1, eh, em);

    while (cur <= endDate) {
      const hh = String(cur.getHours()).padStart(2, "0");
      const mm = String(cur.getMinutes()).padStart(2, "0");
      result.push(`${hh}:${mm}`); // always HH:mm
      cur = addMinutes(cur, step);
    }
    return result;
  };

  for (const rule of rules) {
    if (rule.type === "blocked") {
      return []; // 🔴 whole day blocked
    }

    if (rule.type === "allday") {
      const times = expandRange(
        normalizeToHHMM(rule.start) || churchOpen,
        normalizeToHHMM(rule.end) || churchClose,
        30
      );
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const booked = apptCount[t] || 0;
        slots.push({
          time: normalizeToHHMM(t),
          capacity: cap,
          booked,
          remaining: Math.max(0, cap - booked),
          unavailable: booked >= cap,
        });
      }
      return slots; // ⬅️ allday overrides everything else
    }

    if (rule.type === "single") {
      const t = normalizeToHHMM(rule.time);
      const cap = rule.slots ?? 1;
      const booked = apptCount[t] || 0;
      slots.push({
        time: t,
        capacity: cap,
        booked,
        remaining: Math.max(0, cap - booked),
        unavailable: booked >= cap,
      });
    }

    if (rule.type === "recurring") {
      const times = expandRange(
        normalizeToHHMM(rule.start),
        normalizeToHHMM(rule.end),
        rule.interval_mins
      );
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const booked = apptCount[t] || 0;
        slots.push({
          time: normalizeToHHMM(t),
          capacity: cap,
          booked,
          remaining: Math.max(0, cap - booked),
          unavailable: booked >= cap,
        });
      }
    }
  }

  return slots;
}
