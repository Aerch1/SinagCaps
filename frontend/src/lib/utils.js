import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatStatusLabel = (status) => {
  if (!status) return "";
  const map = {
    pending: "Pending",
    approved: "Approved",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled", // fallback
    failed: "Failed",
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
  if (v === "in_progress" || v === "in progress")
    return `${BASE} bg-indigo-50 text-indigo-700 border-indigo-200`;
  if (v === "completed")
    return `${BASE} bg-blue-50 text-blue-700 border-blue-200`;
  if (["cancelled", "canceled", "failed"].includes(v))
    return `${BASE} bg-red-50 text-red-700 border-red-200`;

  return `${BASE} bg-gray-50 text-gray-600 border-gray-200`;
};

/* ---------- Date/Time formatting (robust) ---------- */
export const formatDate = (v) => {
  if (!v) return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      });
    }
    const d = new Date(v);
    if (!isNaN(d)) {
      return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
      });
    }
    return v;
  }
  if (v instanceof Date && !isNaN(v)) {
    return v.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Manila",
    });
  }
  return String(v);
};

export const formatTime = (v) => {
  if (!v) return "";
  if (typeof v === "string") {
    // 12h 'hh:mm AM/PM'
    const m12 = v.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (m12) {
      let hh = Number(m12[1]);
      const mm = Number(m12[2]);
      const ap = m12[3].toUpperCase();
      if (ap === "PM" && hh < 12) hh += 12;
      if (ap === "AM" && hh === 12) hh = 0;
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      return d.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
    }
    // 24h 'HH:mm' or 'HH:mm:ss'
    const m24 = v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m24) {
      const d = new Date();
      d.setHours(Number(m24[1]), Number(m24[2]), Number(m24[3] || 0), 0);
      return d.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
    }
    const d = new Date(v);
    if (!isNaN(d)) {
      return d.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
      });
    }
    return v;
  }
  if (v instanceof Date && !isNaN(v)) {
    return v.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  }
  return String(v);
};

/* ---------- Range helpers for "Show" ---------- */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const computeRange = (key) => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (key === "7d") {
    const s = new Date(end);
    s.setDate(s.getDate() - 6);
    return { startDate: ymd(s), endDate: ymd(end) };
  }
  if (key === "month") {
    const s = new Date(end.getFullYear(), end.getMonth(), 1);
    const e = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    return { startDate: ymd(s), endDate: ymd(e) };
  }
  if (key === "year") {
    const s = new Date(end.getFullYear(), 0, 1);
    const e = new Date(end.getFullYear(), 11, 31);
    return { startDate: ymd(s), endDate: ymd(e) };
  }
  return { startDate: null, endDate: null };
};

const monthName = (d) => d.toLocaleString("en-US", { month: "long" });

export const fmtRangeLabel = (s, e) => {
  if (!s || !e) return "All";
  const sd = new Date(s),
    ed = new Date(e);
  if (
    sd.getFullYear() === ed.getFullYear() &&
    sd.getMonth() === ed.getMonth()
  ) {
    return `${monthName(
      sd
    )} ${sd.getDate()}–${ed.getDate()}, ${sd.getFullYear()}`;
  }
  if (sd.getFullYear() === ed.getFullYear()) {
    const sm = sd.toLocaleString("en-US", { month: "short" });
    const em = ed.toLocaleString("en-US", { month: "short" });
    return `${sm} ${sd.getDate()}–${em} ${ed.getDate()}, ${sd.getFullYear()}`;
  }
  const sFull = sd.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const eFull = ed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${sFull} – ${eFull}`;
};
