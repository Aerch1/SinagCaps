import pool from "../config/db.js";
import { parseDate, formatDate } from "../utils/dateUtils.js";
import { resolveAvailability } from "../utils/availabilityResolver.js";

/** Normalize DB time strings to HH:mm */
function toHHMM(v) {
  if (!v) return null;
  if (typeof v !== "string") return null;
  return v.length >= 5 ? v.slice(0, 5) : v; // handles "HH:mm" or "HH:mm:ss"
}

/**
 * Get raw data for a service & date: rules, appointments, church hours.
 * Uses JS weekday Sun=0..Sat=6 consistently.
 */
export async function getDayContext(serviceId, dateStr) {
  const dateObj = parseDate(dateStr);
  const isoDate = formatDate(dateObj);
  const weekday = dateObj.getDay(); // 0..6

  const [[rules], [appointments], [hours]] = await Promise.all([
    pool.execute(
      `SELECT * FROM rules
       WHERE service_id = ?
         AND (date = ? OR (date IS NULL AND weekday = ?))
       ORDER BY FIELD(type,'blocked','allday','single','recurring')`,
      [serviceId, isoDate, weekday]
    ),
    pool.execute(
      `SELECT TIME_FORMAT(time, '%H:%i') as time
       FROM appointments
       WHERE service_id = ?
         AND date = ?
         AND status IN ('pending','approved','in_progress')`,
      [serviceId, isoDate]
    ),
    pool.execute(
      `SELECT open_time, close_time, is_closed
       FROM church_hours
       WHERE day_of_week = ?`,
      [weekday]
    ),
  ]);

  const churchHours =
    hours && hours[0]
      ? {
          ...hours[0],
          open_time: toHHMM(hours[0].open_time),
          close_time: toHHMM(hours[0].close_time),
        }
      : null;

  return { isoDate, weekday, rules, appointments, churchHours };
}

/** Unified availability for a day. */
export async function getDayAvailability(serviceId, dateStr) {
  const { isoDate, rules, appointments, churchHours } = await getDayContext(
    serviceId,
    dateStr
  );
  const availability = resolveAvailability({
    rules,
    appointments,
    churchHours,
  });

  // ✅ attach churchHours for validation
  return { isoDate, ...availability, churchHours };
}

/** Find a slot by HH:mm within an availability payload. */
export function findSlot(availability, timeHHMM) {
  if (!availability || !Array.isArray(availability.slots)) return undefined;
  return availability.slots.find((s) => s.time === timeHHMM);
}

/**
 * Should the admin be shown a confirmation modal for this date/time?
 */
export function needsConfirmationForAdmin({ availability, timeHHMM }) {
  if (!availability) {
    return {
      needed: true,
      reasonCode: "NO_SCHEDULE",
      reasonText: "No schedule exists for this date.",
    };
  }

  if (availability.status === "blocked") {
    return {
      needed: true,
      reasonCode: "BLOCKED",
      reasonText: "This date has been blocked by availability rules.",
    };
  }

  if (availability.status === "closed") {
    return {
      needed: true,
      reasonCode: "CLOSED",
      reasonText: "The church is closed on this day.",
    };
  }

  if (availability.status === "none") {
    return {
      needed: true,
      reasonCode: "NO_SCHEDULE",
      reasonText: "No schedule is defined for this day.",
    };
  }

  // ✅ outside hours
  if (availability.churchHours) {
    const open = toHHMM(availability.churchHours.open_time);
    const close = toHHMM(availability.churchHours.close_time);
    const t = toHHMM(timeHHMM);

    if (t < open || t >= close) {
      return {
        needed: true,
        reasonCode: "OUTSIDE_HOURS",
        reasonText: "The selected time is outside the church working hours.",
      };
    }
  }

  return { needed: false };
}
