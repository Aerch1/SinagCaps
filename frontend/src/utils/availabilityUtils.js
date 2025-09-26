// 📌 Availability Utilities

// --- Date helpers ---
export const pad2 = (n) => String(n).padStart(2, "0");

export const formatDate = (date) => {
  if (!(date instanceof Date)) date = new Date(date);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

export const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) =>
  new Date(year, month, 1).getDay();

// --- Time conversion helpers ---
export const to12h = (hhmm) => {
  if (!hhmm) return "";
  const clean = hhmm.length === 5 ? hhmm : hhmm.slice(0, 5); // "08:00:00" → "08:00"
  const d = new Date(`1970-01-01T${clean}:00`);
  return isNaN(d)
    ? hhmm
    : d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
};

export const to24h = (str) => {
  if (!str) return "";
  const d = new Date(`1970-01-01T${str}`);
  if (!isNaN(d)) return d.toISOString().slice(11, 16); // HH:mm
  return str;
};

// --- Generate time slots between open/close (30-min steps, 12h format) ---
export const generateTimeOptions = (churchHours, weekday, stepMinutes = 30) => {
  const hours = churchHours?.[weekday];
  if (!hours) return [];

  if (hours.is_closed) return [];

  const parseTime = (time) => {
    if (!time) return null;

    const mysql = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (mysql) {
      const h = parseInt(mysql[1], 10);
      const m = parseInt(mysql[2], 10);
      return h * 60 + m;
    }

    return null;
  };

  const start = parseTime(hours.open_time);
  const end = parseTime(hours.close_time);

  if (start === null || end === null) return [];

  const result = [];
  for (let mins = start; mins <= end; mins += stepMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const hhmm = `${pad2(h)}:${pad2(m)}`;
    result.push(hhmm); // store HH:mm
  }
  return result;
};

export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
