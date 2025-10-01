// src/utils/generateSlots.js
import { addMinutes } from "date-fns";

// Normalize to HH:mm (e.g. "08:00:00" → "08:00")
function hhmm(s) {
  if (!s) return null;
  return s.length === 8 ? s.slice(0, 5) : s;
}

/**
 * Specificity precedence for same time collisions:
 * single (3) > recurring (2) > allday (1)
 */
function specificityOf(rule) {
  if (rule.type === "single") return 3;
  if (rule.type === "recurring") return 2;
  if (rule.type === "allday") return 1;
  return 0;
}

/**
 * Expand a time range (inclusive start, inclusive end) by step minutes.
 * Returns array of HH:mm strings.
 */
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
 * Always returns unique times; if multiple rules target the same time,
 * the more specific rule wins (single > recurring > allday).
 * Each slot carries capacity/booked/remaining/unavailable.
 */
export function generateSlots({
  rules,
  appointments,
  churchOpen,
  churchClose,
}) {
  // Count booked appointments per time
  const apptCount = {};
  (appointments || []).forEach((a) => {
    const key = hhmm(a.time);
    apptCount[key] = (apptCount[key] || 0) + 1;
  });

  // If there’s any blocked rule, short-circuit (handled also by resolver)
  if (
    (rules || []).some((r) => r.type === "blocked" || r.status === "blocked")
  ) {
    return [];
  }

  // Build a map of time → { capacity, specificity }
  const timeMap = new Map();

  for (const rule of rules || []) {
    if (rule.type === "blocked") {
      return []; // guard (resolver already checks)
    }

    const spec = specificityOf(rule);

    // ALlDAY → expand using church hours if missing
    if (rule.type === "allday") {
      const start = hhmm(rule.start) || hhmm(churchOpen);
      const end = hhmm(rule.end) || hhmm(churchClose);
      const times = expandRange(start, end, 30);
      for (const t of times) {
        const cap = rule.slots != null ? rule.slots : 1; // interpret NULL as 1
        const prev = timeMap.get(t);
        if (!prev || prev.specificity <= spec) {
          timeMap.set(t, { capacity: cap, specificity: spec });
        }
      }
      continue;
    }

    // SINGLE → one time
    if (rule.type === "single") {
      const t = hhmm(rule.time);
      if (!t) continue;
      const cap = rule.slots != null ? rule.slots : 1; // interpret NULL as 1
      const prev = timeMap.get(t);
      if (!prev || prev.specificity < spec) {
        timeMap.set(t, { capacity: cap, specificity: spec });
      } else if (prev.specificity === spec) {
        // if both are single → keep bigger cap
        if (cap > prev.capacity)
          timeMap.set(t, { capacity: cap, specificity: spec });
      }
      continue;
    }

    // RECURRING → expand start..end by interval_mins
    if (rule.type === "recurring") {
      const start = hhmm(rule.start);
      const end = hhmm(rule.end);
      const step = Number(rule.interval_mins) || 30;
      const times = expandRange(start, end, step);
      for (const t of times) {
        const cap = rule.slots != null ? rule.slots : 1; // interpret NULL as 1
        const prev = timeMap.get(t);
        if (!prev || prev.specificity < spec) {
          timeMap.set(t, { capacity: cap, specificity: spec });
        } else if (prev.specificity === spec) {
          if (cap > prev.capacity)
            timeMap.set(t, { capacity: cap, specificity: spec });
        }
      }
      continue;
    }
  }

  // Convert to sorted slot list with booked/remaining
  const timesSorted = [...timeMap.keys()].sort();
  const slots = timesSorted.map((t) => {
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

  return slots;
}
