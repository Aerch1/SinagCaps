import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
} from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ---------- Range helpers ---------- */
export function computeRange(key) {
  const today = new Date();

  switch (key) {
    case "7d": {
      const startDate = subDays(today, 6);
      const endDate = today;
      return {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        label: `${format(startDate, "MMM d")} - ${format(
          endDate,
          "MMM d, yyyy"
        )}`,
      };
    }
    case "month": {
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);
      return {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        label: `${format(startDate, "MMM d")} - ${format(
          endDate,
          "MMM d, yyyy"
        )}`,
      };
    }
    case "year": {
      const startDate = startOfYear(today);
      const endDate = endOfYear(today);
      return {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        label: `${format(startDate, "MMM d, yyyy")} - ${format(
          endDate,
          "MMM d, yyyy"
        )}`,
      };
    }
    case "all":
    default:
      return { startDate: null, endDate: null, label: "All" };
  }
}

/* ---------- Status label + classes ---------- */
export const formatStatusLabel = (status) => {
  if (!status) return "";
  const map = {
    pending: "Pending",
    approved: "Approved",
    completed: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    rejected: "Rejected",
    archived: "Archived",
  };
  return map[status.toLowerCase()] || status;
};

export const statusClass = (s) => {
  const v = String(s || "").toLowerCase();
  const BASE =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium min-w-[80px] text-center";

  if (v === "pending")
    return `${BASE} bg-amber-50 text-amber-700 border-amber-200`;
  if (v === "approved")
    return `${BASE} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (v === "completed")
    return `${BASE} bg-blue-50 text-blue-700 border-blue-200`;
  if (["cancelled", "canceled", "rejected"].includes(v))
    return `${BASE} bg-red-50 text-red-700 border-red-200`;
  if (v === "archived")
    return `${BASE} bg-gray-100 text-gray-600 border-gray-300`;

  return `${BASE} bg-gray-50 text-gray-600 border-gray-200`;
};

/* ---------- Date/Time formatting ---------- */
export const formatDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
};

export const formatTime = (v) => {
  if (!v) return "";
  const d = new Date(`1970-01-01T${v}`);
  if (isNaN(d)) return String(v);
  return d.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  });
};
