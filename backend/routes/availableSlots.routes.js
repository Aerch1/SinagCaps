// src/routes/availability.routes.js
import express from "express";
import pool from "../config/db.js";
import { parseDate, formatDate, getDaysInMonth } from "../utils/dateUtils.js";
import { resolveAvailability } from "../utils/availabilityResolver.js";

const router = express.Router();

/* ==================================================
   GET /api/availability/:serviceId/:date
   → Detailed slots for a single day
================================================== */
router.get("/:serviceId/:date", async (req, res) => {
  const { serviceId, date } = req.params;

  try {
    const targetDate = parseDate(date);
    if (!targetDate) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid date format" });
    }

    const isoDate = formatDate(targetDate);
    const weekday = targetDate.getDay(); // 0..6

    // Fetch in parallel
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

    const churchHours = hours?.[0] || null;

    const availability = resolveAvailability({
      rules,
      appointments,
      churchHours,
    });

    return res.json({ success: true, date: isoDate, ...availability });
  } catch (err) {
    console.error("❌ availability fetch failed", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch slots" });
  }
});

/* ==================================================
   GET /api/availability/:serviceId/month/:year/:month
   → Calendar overview for one month
================================================== */
router.get("/:serviceId/month/:year/:month", async (req, res) => {
  const { serviceId, year, month } = req.params;

  try {
    const y = Number(year);
    const m = Number(month); // 1..12
    const daysInMonth = getDaysInMonth(y, m - 1);

    // Preload once
    const [[rules], [appointments], [hours]] = await Promise.all([
      pool.execute(
        `SELECT id, date, type, slots, start, end, interval_mins, weekday, status, time
         FROM rules
         WHERE service_id = ?
           AND (YEAR(date) = ? OR date IS NULL)
           AND (MONTH(date) = ? OR date IS NULL)`,
        [serviceId, y, m]
      ),
      pool.execute(
        `SELECT DATE(date) as d, TIME_FORMAT(time, '%H:%i') as time
         FROM appointments
         WHERE service_id = ?
           AND YEAR(date) = ?
           AND MONTH(date) = ?
           AND status IN ('pending','approved','in_progress')`,
        [serviceId, y, m]
      ),
      pool.execute(
        `SELECT day_of_week, open_time, close_time, is_closed FROM church_hours`
      ),
    ]);

    // Group appts by yyyy-MM-dd
    const apptsByDay = {};
    for (const a of appointments) {
      const key = formatDate(a.d);
      (apptsByDay[key] ||= []).push(a);
    }

    const days = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )}`;
      const dt = parseDate(iso);
      const weekday = dt.getDay();

      // Specific date rules first, else weekly rules
      const rulesForDay = rules.filter(
        (r) => r.date && formatDate(r.date) === iso
      );
      const weeklyRules = rules.filter((r) => !r.date && r.weekday === weekday);
      const dayRules = rulesForDay.length ? rulesForDay : weeklyRules;

      const churchHours =
        (hours || []).find((h) => h.day_of_week === weekday) || null;

      const availability = resolveAvailability({
        rules: dayRules,
        appointments: apptsByDay[iso] || [],
        churchHours,
      });

      // ✅ trust resolveAvailability for status
      days[iso] = {
        status: availability.status, // "available" | "blocked" | "none"
        remaining: availability.remaining,
        capacity: availability.capacity,
        booked: availability.booked,
      };
    }

    return res.json({ success: true, days });
  } catch (err) {
    console.error("❌ fetch month availability failed", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch calendar availability" });
  }
});

export default router;
