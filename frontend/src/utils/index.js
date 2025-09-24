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

/* ---------- time helpers ---------- */
export const to12h = (h, m) => {
  const ap = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
};

export const parse12h = (s) => {
  const m = String(s || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ap = m[3].toUpperCase();
  if (hh === 12) hh = 0;
  const H = ap === "PM" ? hh + 12 : hh;
  return { H, M: mm };
};

export const minOf12h = (s) => {
  const p = parse12h(s);
  if (!p) return Number.MAX_SAFE_INTEGER;
  return p.H * 60 + p.M;
};

export const timeSort = (a, b) => minOf12h(a.time) - minOf12h(b.time);

export const generate12hOptions = (
  start24 = "06:00",
  end24 = "20:00",
  everyMin = 30
) => {
  const to24 = (s) => s.split(":").map(Number);
  const [sh, sm] = to24(start24);
  const [eh, em] = to24(end24);
  const out = [];
  let h = sh,
    m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(to12h(h, m));
    m += everyMin;
    while (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
};

export const TIME_OPTS = generate12hOptions("06:00", "20:00", 30);

/* ---------- weekdays constant ---------- */
export const WEEKDAYS = [
  { i: 1, label: "Monday" },
  { i: 2, label: "Tuesday" },
  { i: 3, label: "Wednesday" },
  { i: 4, label: "Thursday" },
  { i: 5, label: "Friday" },
  { i: 6, label: "Saturday" },
  { i: 0, label: "Sunday" },
];

/* ---------- availability persistence (localStorage mock) ---------- */
const AVAIL_KEY = "adminAvailability";

export const loadAvailability = () => {
  try {
    const raw = localStorage.getItem(AVAIL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load availability:", e);
    return {};
  }
};

export const saveAvailability = (data) => {
  try {
    localStorage.setItem(AVAIL_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save availability:", e);
  }
};

/* ---------- default availability template ---------- */
export const defaultAvailability = () => ({
  defaultSlotsPerTime: 0,
  weekdays: {}, // { 0: ["08:00 AM", "09:00 AM"], ... }
  timeCapacity: {}, // { "08:00 AM": 5 }
  blocked: [],
  overrides: {},
});

/* ---------- global availability state (mutable) ---------- */
export let ADMIN_AVAILABILITY = loadAvailability() || {};

/* ---------- slot capacity helpers ---------- */
const capacityForTime = (service, isoDate, time) => {
  const conf = ADMIN_AVAILABILITY[service];
  if (!conf) return 0;

  const o = conf.overrides?.[isoDate];

  if (o?.timeCapacity && typeof o.timeCapacity[time] === "number") {
    return o.timeCapacity[time];
  }
  if (conf.timeCapacity && typeof conf.timeCapacity[time] === "number") {
    return conf.timeCapacity[time];
  }
  return conf.defaultSlotsPerTime ?? 0;
};

const bookedForTime = (service, isoDate, time, cap) => {
  const o = ADMIN_AVAILABILITY[service]?.overrides?.[isoDate];
  if (o?.booked && typeof o.booked[time] === "number") {
    return Math.max(0, Math.min(cap, o.booked[time]));
  }
  return 0;
};

export const slotsLeftForTime = (service, isoDate, time) => {
  const cap = capacityForTime(service, isoDate, time);
  if (cap <= 0) return 0;
  const booked = bookedForTime(service, isoDate, time, cap);
  return Math.max(0, cap - booked);
};

/* ---------- resolve schedule & build month payload ---------- */
const resolveTimesForDate = (service, y, m, d) => {
  const conf = ADMIN_AVAILABILITY[service];
  if (!conf) return [];
  const iso = `${monthKey(y, m)}-${pad2(d)}`;
  const o = conf.overrides?.[iso];

  if (o && Object.prototype.hasOwnProperty.call(o, "times")) {
    return o.times || [];
  }
  const dow = new Date(y, m, d).getDay();
  return conf.weekdays?.[dow] ?? [];
};

export const buildMonthPayload = (service, y, m) => {
  const key = monthKey(y, m);
  const dim = daysInMonth(y, m);
  const conf = ADMIN_AVAILABILITY[service];
  const days = [];

  if (!conf) return { month: key, days };

  for (let d = 1; d <= dim; d++) {
    const iso = `${key}-${pad2(d)}`;
    const o = conf.overrides?.[iso];

    if (conf.blocked?.includes(iso) || o?.status === "blocked") {
      days.push({ date: iso, status: "blocked", times: [] });
      continue;
    }

    if (o?.status === "unavailable") {
      const t =
        o && Object.prototype.hasOwnProperty.call(o, "times")
          ? o.times || []
          : [];
      days.push({ date: iso, status: "unavailable", times: t });
      continue;
    }

    const baseTimes = resolveTimesForDate(service, y, m, d);
    if (!baseTimes || baseTimes.length === 0) continue;

    const hasSlots = baseTimes.some(
      (t) => slotsLeftForTime(service, iso, t) > 0
    );

    days.push({
      date: iso,
      status: hasSlots ? "available" : "unavailable",
      times: baseTimes,
    });
  }

  return { month: key, days };
};
