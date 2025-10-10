// backend/utils/dateUtils.js

// Pad single digit with leading zero
export const pad2 = (n) => String(n).padStart(2, "0");

// yyyy-MM-dd
export const formatDate = (date) => {
  if (!(date instanceof Date)) date = new Date(date);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
};

// Parse "yyyy-MM-dd" into local Date
export const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d); // local-safe
};

// Days in month (month is 0-indexed)
export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

// First weekday of month (0=Sun,6=Sat)
export const getFirstDayOfMonth = (year, month) =>
  new Date(year, month, 1).getDay();

/* ===================================================
   🆕 Additional Readable Formatting Helpers
=================================================== */

// Format date into "Month Day, Year" (e.g. October 10, 2025)
export const formatReadableDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Convert "HH:mm:ss" or "HH:mm" into "h:mm AM/PM"
export const formatReadableTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
