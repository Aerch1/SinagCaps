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
