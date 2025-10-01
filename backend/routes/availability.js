// src/routes/availability.routes.js
import express from "express";
import pool from "../config/db.js";
import { generateSlots } from "../utils/generateSlots.js";
import { parseDate, formatDate, getDaysInMonth } from "../utils/dateUtils.js";

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
    const isoDate = formatDate(targetDate); // yyyy-MM-dd
    const weekday = targetDate.getDay(); // 0=Sun..6=Sat

    // 1. Rules (specific date or weekly fallback)
    const [rules] = await pool.execute(
      `SELECT * FROM rules 
       WHERE service_id = ?
         AND (
           date = ? 
           OR (date IS NULL AND weekday = ?)
         )
       ORDER BY FIELD(type,'blocked','allday','single','recurring')`,
      [serviceId, isoDate, weekday]
    );

    // 🔹 If blocked rule exists → return early
    const isBlocked = rules.some(
      (r) => r.type === "blocked" || r.status === "blocked"
    );
    if (isBlocked) {
      return res.json({
        success: true,
        slots: [],
        status: "blocked",
        message: "This date is blocked (closed)",
      });
    }

    // 2. Appointments for this date
    const [appointments] = await pool.execute(
      `SELECT TIME_FORMAT(time, '%H:%i') as time
       FROM appointments
       WHERE service_id = ?
         AND date = ?
         AND status IN ('pending','approved','in_progress')`,
      [serviceId, isoDate]
    );

    // 3. Church hours
    const [hours] = await pool.execute(
      `SELECT open_time, close_time, is_closed
       FROM church_hours
       WHERE day_of_week = ?`,
      [weekday]
    );

    if (hours.length === 0 || hours[0].is_closed) {
      return res.json({ success: true, slots: [], status: "none" });
    }

    const churchOpen = hours[0].open_time.substring(0, 5);
    const churchClose = hours[0].close_time.substring(0, 5);

    // 4. Generate slots
    const slots = generateSlots({
      rules,
      appointments,
      churchOpen,
      churchClose,
    });

    const normalized = slots.map((s) => ({
      time: s.time,
      remaining: s.remaining || 0,
      unavailable: !!s.unavailable,
    }));

    res.json({
      success: true,
      slots: normalized,
      status: normalized.length ? "available" : "none",
    });
  } catch (err) {
    console.error("❌ availability fetch failed", err);
    res.status(500).json({ success: false, error: "Failed to fetch slots" });
  }
});

/* ==================================================
   GET /api/availability/:serviceId/month/:year/:month
   → Calendar overview for one month
================================================== */
router.get("/:serviceId/month/:year/:month", async (req, res) => {
  const { serviceId, year, month } = req.params;

  try {
    const daysInMonth = getDaysInMonth(Number(year), Number(month) - 1); // month is 0-indexed

    // Preload rules + church hours for efficiency
    const [rules] = await pool.execute(
      `SELECT id, date, type, slots, start, end, interval_mins, weekday, status
       FROM rules
       WHERE service_id = ?
         AND (YEAR(date) = ? OR date IS NULL)
         AND (MONTH(date) = ? OR date IS NULL)`,
      [serviceId, year, month]
    );

    const [appointments] = await pool.execute(
      `SELECT DATE(date) as d, TIME_FORMAT(time, '%H:%i') as time
       FROM appointments
       WHERE service_id = ?
         AND YEAR(date) = ?
         AND MONTH(date) = ?
         AND status IN ('pending','approved','in_progress')`,
      [serviceId, year, month]
    );

    const [hours] = await pool.execute(`SELECT * FROM church_hours`);

    // Group appointments by date
    const apptsByDay = {};
    for (const a of appointments) {
      const key = formatDate(a.d); // ensure yyyy-MM-dd
      apptsByDay[key] = apptsByDay[key] || [];
      apptsByDay[key].push(a);
    }

    const days = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const targetDate = parseDate(iso);
      const weekday = targetDate.getDay();

      // Rules for this day (specific > weekly)
      const rulesForDay = rules.filter(
        (r) => r.date && formatDate(r.date) === iso
      );
      const weeklyRules = rules.filter((r) => !r.date && r.weekday === weekday);
      const dayRules = rulesForDay.length ? rulesForDay : weeklyRules;

      // 🔹 Blocked check
      const isBlocked = dayRules.some(
        (r) => r.type === "blocked" || r.status === "blocked"
      );
      if (isBlocked) {
        days[iso] = { status: "blocked", remaining: 0, capacity: 0, booked: 0 };
        continue;
      }

      // Church hours
      const ch = hours.find((h) => h.day_of_week === weekday);
      if (!ch || ch.is_closed) {
        days[iso] = { status: "none", remaining: 0, capacity: 0, booked: 0 };
        continue;
      }

      // Generate slots
      const slots = generateSlots({
        rules: dayRules,
        appointments: apptsByDay[iso] || [],
        churchOpen: ch.open_time.substring(0, 5),
        churchClose: ch.close_time.substring(0, 5),
      });

      if (!slots.length) {
        days[iso] = { status: "none", remaining: 0, capacity: 0, booked: 0 };
        continue;
      }

      // Totals
      const totalCapacity = slots.reduce(
        (sum, s) => sum + (s.capacity || 1),
        0
      );
      const totalBooked = slots.reduce((sum, s) => sum + (s.booked || 0), 0);
      const totalRemaining = Math.max(0, totalCapacity - totalBooked);

      if (totalRemaining === 0) {
        days[iso] = {
          status: "blocked",
          remaining: 0,
          capacity: totalCapacity,
          booked: totalBooked,
        };
      } else {
        days[iso] = {
          status: "available",
          remaining: totalRemaining,
          capacity: totalCapacity,
          booked: totalBooked,
        };
      }
    }

    res.json({ success: true, days });
  } catch (err) {
    console.error("❌ fetch month availability failed", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch calendar availability" });
  }
});

export default router;
