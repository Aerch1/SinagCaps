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
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) =>
  new Date(year, month, 1).getDay();

// --- Time Options (24hr with AM/PM display) ---
export const TIME_OPTIONS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

// --- Weekdays ---
export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// --- Status Colors (can be used globally if needed) ---
export const STATUS_COLORS = {
  available: {
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-600",
  },
  unavailable: {
    bg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    text: "text-amber-700",
    icon: "text-amber-600",
  },
  blocked: {
    bg: "bg-red-50 hover:bg-red-100 border-red-200",
    text: "text-red-700",
    icon: "text-red-600",
  },
  neutral: {
    bg: "bg-white hover:bg-gray-50 border-gray-200",
    text: "text-gray-700",
    icon: "text-gray-400",
  },
};
