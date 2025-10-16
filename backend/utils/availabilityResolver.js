// src/utils/availabilityResolver.js
import { generateSlots } from "./generateSlots.js";

/**
 * Single source of truth for availability resolution.
 * Applies church hours, blocked checks, generates + aggregates slots.
 *
 * @returns {
 *   status: "available" | "full" | "blocked" | "none",
 *   slots: Array<{ time: "HH:mm", remaining: number, unavailable: boolean }>,
 *   capacity: number, booked: number, remaining: number
 * }
 */
export function resolveAvailability({ rules, appointments, churchHours }) {
  // 🔹 Church closed or no config
  if (!churchHours || churchHours.is_closed) {
    return { status: "none", slots: [], capacity: 0, booked: 0, remaining: 0 };
  }

  // 🔹 Hard block (explicit rule)
  const isBlocked = rules?.some(
    (r) => r.type === "blocked" || r.status === "blocked"
  );
  if (isBlocked) {
    return {
      status: "blocked",
      slots: [],
      capacity: 0,
      booked: 0,
      remaining: 0,
    };
  }

  // 🔹 Generate slots (from rules + appts + church hours)
  let slots = generateSlots({
    rules: rules || [],
    appointments: appointments || [],
    churchOpen: churchHours.open_time?.slice(0, 5),
    churchClose: churchHours.close_time?.slice(0, 5),
  });

  // ✅ Filter out past-time slots (only for *today*, not future dates)
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const firstSlotDate =
    rules?.find((r) => r.date)?.date || appointments?.[0]?.date || null;

  // Determine if this availability refers to today
  const isToday =
    firstSlotDate &&
    new Date(firstSlotDate).toISOString().split("T")[0] === todayStr;

  if (isToday) {
    const currentTime = now.toTimeString().slice(0, 5); // "HH:mm"
    slots = slots.filter((s) => s.time > currentTime);
  }

  // 🔹 No slots at all
  if (!slots.length) {
    return { status: "none", slots: [], capacity: 0, booked: 0, remaining: 0 };
  }

  // 🔹 Aggregate totals
  const capacity = slots.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const booked = slots.reduce((sum, s) => sum + (s.booked || 0), 0);
  const remaining = Math.max(0, capacity - booked);

  // ✅ Status logic
  let status = "none";
  if (slots.some((s) => s.remaining > 0)) {
    status = "available"; // at least one slot open
  } else if (slots.length > 0) {
    status = "full"; // slots exist but all are booked
  }

  return {
    status,
    slots: slots.map((s) => ({
      time: s.time,
      remaining:
        s.remaining ?? Math.max(0, (s.capacity || 0) - (s.booked || 0)),
      unavailable: s.unavailable ?? (s.booked || 0) >= (s.capacity || 0),
    })),
    capacity,
    booked,
    remaining,
  };
}
