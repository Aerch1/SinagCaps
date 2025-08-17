// src/utils/index.js

/* ---------- date helpers ---------- */
export const pad2 = (n) => String(n).padStart(2, "0");

export const toISO = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const fromISO = (iso) => {
  const [Y, M, D] = iso.split("-").map(Number);
  return new Date(Y, M - 1, D);
};

export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export const firstDayOfWeek = (y, m) => new Date(y, m, 1).getDay();
export const lastDayOfWeek = (y, m) =>
  new Date(y, m, daysInMonth(y, m)).getDay();
export const monthKey = (y, m) => `${y}-${pad2(m + 1)}`;
export const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ---------- ADMIN mock: flexible per-service config ----------
  - weekdays: { 0..6: ["HH:MM AM/PM", ...] } -> which times are offered by weekday
  - blocked:  ["YYYY-MM-DD"] -> fully blocked dates (red)
  - overrides: {
      "YYYY-MM-DD": {
        status?: "available"|"unavailable"|"blocked", // explicit day status
        times?: string[],                              // REPLACES weekday times for that date (no merge)
        timeCapacity?: { [time]: number },             // per-time capacity for this date
        booked?: { [time]: number }                    // how many already booked (0..capacity)
      }
    }
  - defaultSlotsPerTime: fallback capacity per time if not specified
  - timeCapacity: { [time]: number } default capacity for that specific time (optional)
*/
export const ADMIN_AVAILABILITY = {
  baptism: {
    defaultSlotsPerTime: 6, // fallback seats per time
    weekdays: {
      0: ["11:00 AM", "01:00 PM"], // Sundays
      6: ["09:00 AM", "02:00 PM"], // Saturdays
    },
    timeCapacity: { "11:00 AM": 8 }, // global per-time default (beats defaultSlotsPerTime)
    blocked: ["2025-09-19"], // whole date is not bookable
    overrides: {
      // Example: specific date with one custom time and capacity
      "2025-09-13": {
        status: "available",
        times: ["08:00 AM", "9:00 AM"], // replaces weekday times entirely
        timeCapacity: { "08:00 AM": 9 }, // capacity for this date/time
        booked: { "08:00 AM": 0 }, // 0 booked -> 9 slots left
      },
      "2025-09-07": { status: "unavailable" }, // force red even if it's a normally scheduled Sunday
      // To intentionally offer NO times (but not blocked), you can do:
      // "2025-09-26": { times: [] } // renders as neutral unless you also set status:"unavailable" to show red
    },
  },

  confirmation: {
    defaultSlotsPerTime: 10,
    weekdays: {
      1: ["08:00 AM", "10:00 AM"],
      3: ["08:00 AM", "10:00 AM"],
      5: ["08:00 AM", "10:00 AM"],
    }, // Mon/Wed/Fri
    blocked: [],
    overrides: {},
  },

  marriage: {
    defaultSlotsPerTime: 3,
    weekdays: { 6: ["10:00 AM", "01:00 PM", "03:30 PM"] }, // Sat
    blocked: [],
    overrides: {},
  },

  confession: {
    defaultSlotsPerTime: 20,
    weekdays: {
      2: ["04:00 PM", "05:00 PM", "06:00 PM"],
      4: ["04:00 PM", "05:00 PM", "06:00 PM"],
    }, // Tue/Thu
    blocked: [],
    overrides: {},
  },

  anointing: {
    defaultSlotsPerTime: 5,
    weekdays: { 2: ["09:30 AM", "01:30 PM"], 4: ["09:30 AM", "01:30 PM"] }, // Tue/Thu
    blocked: [],
    overrides: {},
  },
};

/* ---------- capacity & slots (no randomness) ---------- */
const capacityForTime = (service, isoDate, time) => {
  const conf = ADMIN_AVAILABILITY[service];
  if (!conf) return 0;

  const o = conf.overrides?.[isoDate];

  // Per-date per-time override takes precedence
  if (o?.timeCapacity && typeof o.timeCapacity[time] === "number") {
    return o.timeCapacity[time];
  }

  // Then global per-time default
  if (conf.timeCapacity && typeof conf.timeCapacity[time] === "number") {
    return conf.timeCapacity[time];
  }

  // Fallback to service-wide default
  return conf.defaultSlotsPerTime ?? 0;
};

const bookedForTime = (service, isoDate, time, cap) => {
  const o = ADMIN_AVAILABILITY[service]?.overrides?.[isoDate];
  if (o?.booked && typeof o.booked[time] === "number") {
    // clamp between 0 and capacity
    return Math.max(0, Math.min(cap, o.booked[time]));
  }
  // If not provided, treat as 0 booked (full capacity left)
  return 0;
};

/* Public: slots left for a specific time */
export const slotsLeftForTime = (service, isoDate, time) => {
  const cap = capacityForTime(service, isoDate, time);
  if (cap <= 0) return 0;
  const booked = bookedForTime(service, isoDate, time, cap);
  return Math.max(0, cap - booked);
};

/* Resolve the time list for a date.
   IMPORTANT: If an override exists **and includes a 'times' key**, it REPLACES the weekday schedule entirely.
   - 'times: []' is allowed and means intentionally no times for that date.
   - If there is no 'times' key in the override, we fall back to weekday schedule. */
const resolveTimesForDate = (service, y, m, d) => {
  const conf = ADMIN_AVAILABILITY[service];
  if (!conf) return [];
  const iso = `${monthKey(y, m)}-${pad2(d)}`;
  const o = conf.overrides?.[iso];

  if (o && Object.prototype.hasOwnProperty.call(o, "times")) {
    return o.times || []; // replace entirely (even empty)
  }
  const dow = new Date(y, m, d).getDay();
  return conf.weekdays?.[dow] ?? [];
};

/* ---------- Month payload ----------
   Day status rules (used by UI colors, unchanged):
   - blocked or override.status === "blocked" -> "blocked" (red)
   - override.status === "unavailable"       -> "unavailable" (red)
   - else if has scheduled times:
       * any time with slotsLeft > 0 -> "available" (green)
       * otherwise                   -> "unavailable" (red)
   - no schedule & no override -> omitted (UI renders as neutral gray)
------------------------------------- */
export const buildMonthPayload = (service, y, m) => {
  const key = monthKey(y, m);
  const dim = daysInMonth(y, m);
  const conf = ADMIN_AVAILABILITY[service];
  const days = [];

  if (!conf) return { month: key, days }; // everything neutral (gray)

  for (let d = 1; d <= dim; d++) {
    const iso = `${key}-${pad2(d)}`;
    const o = conf.overrides?.[iso];

    // 1) Explicit blocked
    if (conf.blocked?.includes(iso) || o?.status === "blocked") {
      days.push({ date: iso, status: "blocked", times: [] });
      continue;
    }

    // 2) Explicit unavailable
    if (o?.status === "unavailable") {
      // if override provided times for UI context, keep them; otherwise []
      const t =
        o && Object.prototype.hasOwnProperty.call(o, "times")
          ? o.times || []
          : [];
      days.push({ date: iso, status: "unavailable", times: t });
      continue;
    }

    // 3) Scheduled by weekday OR override times (override 'times' replaces entirely)
    const baseTimes = resolveTimesForDate(service, y, m, d);
    if (!baseTimes || baseTimes.length === 0) {
      // No schedule -> neutral (omit)
      continue;
    }

    const hasSlots = baseTimes.some(
      (t) => slotsLeftForTime(service, iso, t) > 0
    );

    days.push({
      date: iso,
      status: hasSlots ? "available" : "unavailable",
      times: baseTimes, // UI will filter per-time with slotsLeftForTime()
    });
  }

  return { month: key, days };
};
