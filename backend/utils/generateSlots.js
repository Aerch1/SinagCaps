// src/utils/generateSlots.js
import { addMinutes } from "date-fns";

// Normalize to HH:mm
function hhmm(s) {
  if (!s) return null;
  return s.length === 8 ? s.slice(0, 5) : s;
}

// Rule specificity (priority: single > recurring > allday)
function specificityOf(rule) {
  if (rule.type === "single") return 3;
  if (rule.type === "recurring") return 2;
  if (rule.type === "allday") return 1;
  return 0;
}

// Expand start..end into array of HH:mm times
function expandRange(start, end, step) {
  const startHH = hhmm(start),
    endHH = hhmm(end);
  if (!startHH || !endHH) return [];
  let [sh, sm] = startHH.split(":").map(Number);
  let [eh, em] = endHH.split(":").map(Number);
  let cur = new Date(2000, 0, 1, sh, sm);
  const endDate = new Date(2000, 0, 1, eh, em);

  const out = [];
  while (cur <= endDate) {
    const hh = String(cur.getHours()).padStart(2, "0");
    const mm = String(cur.getMinutes()).padStart(2, "0");
    out.push(`${hh}:${mm}`);
    cur = addMinutes(cur, step);
  }
  return out;
}

/**
 * Generate merged slots from rules + appointments + church hours.
 * Always returns unique times; more specific rules override less specific.
 */
export function generateSlots({
  rules,
  appointments,
  churchOpen,
  churchClose,
}) {
  // Count booked appointments
  const apptCount = {};
  (appointments || []).forEach((a) => {
    const key = hhmm(a.time);
    apptCount[key] = (apptCount[key] || 0) + 1;
  });

  // Blocked rules → no slots
  if (
    (rules || []).some((r) => r.type === "blocked" || r.status === "blocked")
  ) {
    return [];
  }

  const timeMap = new Map();

  for (const rule of rules || []) {
    const spec = specificityOf(rule);

    // ALlDAY
    if (rule.type === "allday") {
      const start = hhmm(rule.start) || hhmm(churchOpen);
      const end = hhmm(rule.end) || hhmm(churchClose);
      const step = Number(rule.interval_mins) || 30;
      const times = expandRange(start, end, step);
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const prev = timeMap.get(t);
        if (!prev || prev.specificity <= spec) {
          timeMap.set(t, { capacity: cap, specificity: spec });
        }
      }
      continue;
    }

    // SINGLE
    if (rule.type === "single") {
      const t = hhmm(rule.time);
      if (!t) continue;
      const cap = rule.slots ?? 1;
      const prev = timeMap.get(t);
      if (
        !prev ||
        prev.specificity < spec ||
        (prev.specificity === spec && cap > prev.capacity)
      ) {
        timeMap.set(t, { capacity: cap, specificity: spec });
      }
      continue;
    }

    // RECURRING
    if (rule.type === "recurring") {
      const start = hhmm(rule.start) || hhmm(churchOpen);
      const end = hhmm(rule.end) || hhmm(churchClose);
      const step = Number(rule.interval_mins) || 30;
      const times = expandRange(start, end, step);
      for (const t of times) {
        const cap = rule.slots ?? 1;
        const prev = timeMap.get(t);
        if (
          !prev ||
          prev.specificity < spec ||
          (prev.specificity === spec && cap > prev.capacity)
        ) {
          timeMap.set(t, { capacity: cap, specificity: spec });
        }
      }
      continue;
    }
  }

  // Convert to sorted slots
  const timesSorted = [...timeMap.keys()].sort();
  return timesSorted.map((t) => {
    const cap = timeMap.get(t).capacity || 0;
    const booked = apptCount[t] || 0;
    const remaining = Math.max(0, cap - booked);
    return {
      time: t,
      capacity: cap,
      booked,
      remaining,
      unavailable: booked >= cap,
    };
  });
}
