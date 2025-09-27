import { addMinutes } from "date-fns";

/**
 * Expand rules into available slots for a given service + date
 * @param {Array} rules - rules from DB for that service/date
 * @param {Array} appointments - existing appointments [{ time: "HH:mm" }]
 * @param {string} churchOpen - "HH:mm"
 * @param {string} churchClose - "HH:mm"
 * @returns {Array} slots [{ time, remaining, unavailable }]
 */
export function generateSlots({
  rules,
  appointments,
  churchOpen,
  churchClose,
}) {
  const slots = [];
  const apptCount = {};

  // count appointments by time
  appointments.forEach((a) => {
    apptCount[a.time] = (apptCount[a.time] || 0) + 1;
  });

  // helper: expand range into times
  const expandRange = (start, end, step) => {
    const result = [];
    let [sh, sm] = start.split(":").map(Number);
    let [eh, em] = end.split(":").map(Number);
    let cur = new Date(2000, 0, 1, sh, sm);
    let endDate = new Date(2000, 0, 1, eh, em);

    while (cur <= endDate) {
      const hh = String(cur.getHours()).padStart(2, "0");
      const mm = String(cur.getMinutes()).padStart(2, "0");
      result.push(`${hh}:${mm}`);
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
        rule.start || churchOpen,
        rule.end || churchClose,
        30
      );
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const booked = apptCount[t] || 0;
        slots.push({
          time: t,
          remaining: Math.max(0, cap - booked),
          unavailable: booked >= cap,
        });
      }
      return slots; // ⬅️ allday overrides everything else
    }

    if (rule.type === "single") {
      const cap = rule.slots ?? 1;
      const booked = apptCount[rule.time] || 0;
      slots.push({
        time: rule.time,
        remaining: Math.max(0, cap - booked),
        unavailable: booked >= cap,
      });
    }

    if (rule.type === "recurring") {
      const times = expandRange(rule.start, rule.end, rule.interval_mins);
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const booked = apptCount[t] || 0;
        slots.push({
          time: t,
          remaining: Math.max(0, cap - booked),
          unavailable: booked >= cap,
        });
      }
    }
  }

  return slots;
}
