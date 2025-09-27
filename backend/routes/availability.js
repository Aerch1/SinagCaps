import express from "express";
import pool from "../config/db.js";
import { generateSlots } from "../utils/generateSlots.js";

const router = express.Router();

// GET /api/availability/:serviceId/:date
router.get("/:serviceId/:date", async (req, res) => {
  const { serviceId, date } = req.params;

  try {
    // 1. Get rules for serviceId + exact date OR matching weekday (weekly fallback)
    const [rules] = await pool.execute(
      `SELECT * FROM rules 
       WHERE service_id = ?
         AND (
           date = ? 
           OR (date IS NULL AND weekday = DAYOFWEEK(?) - 1)
         )
       ORDER BY FIELD(type,'blocked','allday','single','recurring')`,
      [serviceId, date, date]
    );

    // 2. Get existing appointments (active statuses)
    const [appointments] = await pool.execute(
      `SELECT TIME_FORMAT(time, '%H:%i') as time
       FROM appointments
       WHERE service_id = ?
         AND date = ?
         AND status IN ('pending','approved','in_progress')`,
      [serviceId, date]
    );

    // 3. Get fallback church hours
    const [hours] = await pool.execute(
      `SELECT open_time, close_time, is_closed
       FROM church_hours
       WHERE day_of_week = DAYOFWEEK(?) - 1`,
      [date]
    );

    if (hours.length === 0 || hours[0].is_closed) {
      return res.json({ success: true, slots: [] });
    }

    const churchOpen = hours[0].open_time.substring(0, 5); // "HH:mm"
    const churchClose = hours[0].close_time.substring(0, 5);

    // 4. Generate slots
    const slots = generateSlots({
      rules,
      appointments,
      churchOpen,
      churchClose,
    });

    // 🔹 Normalize response so frontend knows exactly what to expect
    const normalized = slots.map((s) => ({
      time: s.time, // "HH:mm"
      remaining: s.remaining || 0, // number of slots left
      unavailable: !!s.unavailable, // boolean
    }));

    res.json({ success: true, slots: normalized });
  } catch (err) {
    console.error("❌ availability fetch failed", err);
    res.status(500).json({ success: false, error: "Failed to fetch slots" });
  }
});

// routes/availability.js
router.get("/:serviceId/month/:year/:month", async (req, res) => {
  const { serviceId, year, month } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT DATE(date) as d, type, status
       FROM rules
       WHERE service_id = ?
         AND (YEAR(date) = ? AND MONTH(date) = ?)`,
      [serviceId, year, month]
    );

    // normalize → { "2025-09-03": "blocked", "2025-09-05": "available", ... }
    const days = {};
    for (const r of rows) {
      if (r.type === "allday" && r.status === "blocked") {
        days[r.d] = "blocked";
      } else {
        days[r.d] = "available"; // could refine by checking slots
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
