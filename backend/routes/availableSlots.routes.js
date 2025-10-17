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

    // ✅ Prevent returning availability for past dates
    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const targetOnly = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );

    if (targetOnly < todayOnly) {
      return res.json({
        success: true,
        date,
        status: "none",
        slots: [],
        message: "Past date — no slots available",
      });
    }

    // ✅ Booking cutoff check (must book at least cutoff_days before target date)
    const [[serviceRow]] = await pool.execute(
      `SELECT cutoff_days FROM services WHERE id = ? LIMIT 1`,
      [serviceId]
    );
    const cutoffDays = serviceRow?.cutoff_days || 0;

    if (cutoffDays > 0) {
      const diffTime = targetOnly.getTime() - todayOnly.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24); // convert ms → days

      if (diffDays < cutoffDays) {
        return res.json({
          success: true,
          date,
          status: "none",
          slots: [],
          message: `Booking cutoff: must book at least ${cutoffDays} day(s) in advance.`,
        });
      }
    }

    const isoDate = formatDate(targetDate);
    const weekday = targetDate.getDay(); // 0..6

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
           AND status IN ('pending','approved')`,
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

    // ✅ Fetch cutoff_days for this service
    const [[serviceRow]] = await pool.execute(
      `SELECT cutoff_days FROM services WHERE id = ? LIMIT 1`,
      [serviceId]
    );
    const cutoffDays = serviceRow?.cutoff_days || 0;
    const now = new Date();
    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const [[rules], [appointments], [hours]] = await Promise.all([
      pool.execute(
        `SELECT * FROM rules
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
           AND status IN ('pending','approved')`,
        [serviceId, y, m]
      ),
      pool.execute(
        `SELECT day_of_week, open_time, close_time, is_closed FROM church_hours`
      ),
    ]);

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
      const targetOnly = new Date(
        dt.getFullYear(),
        dt.getMonth(),
        dt.getDate()
      );

      // ✅ Skip or mark past days as unavailable
      if (targetOnly < todayOnly) {
        days[iso] = { status: "none", remaining: 0, capacity: 0, booked: 0 };
        continue;
      }

      // ✅ Apply cutoff logic for monthly overview
      if (cutoffDays > 0) {
        const diffTime = targetOnly.getTime() - todayOnly.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24); // convert ms → days

        if (diffDays < cutoffDays) {
          days[iso] = { status: "none", remaining: 0, capacity: 0, booked: 0 };
          continue;
        }
      }

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

      days[iso] = {
        status: availability.status,
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
