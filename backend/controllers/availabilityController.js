import pool from "../config/db.js";

/* ---------------- GET /api/availability/:service_id/:date ---------------- */
export const getAvailability = async (req, res) => {
  const { service_id, date } = req.params;

  try {
    // ---------------- A) Church hours for that weekday ----------------
    const [churchRows] = await pool.execute(
      `SELECT open_time, close_time, is_closed, day_of_week
       FROM church_hours
       WHERE day_of_week = DAYOFWEEK(?) - 1`,
      [date]
    );

    if (!churchRows.length || churchRows[0].is_closed) {
      return res.json({ success: true, slots: [] });
    }

    const { open_time, close_time } = churchRows[0];

    // ---------------- B) Weekly rules ----------------
    const [weeklyRows] = await pool.execute(
      `SELECT time, slots
       FROM weekly_rules
       WHERE service_id = ? AND weekday = DAYOFWEEK(?) - 1`,
      [service_id, date]
    );

    // ---------------- C) Custom date overrides ----------------
    const [customRows] = await pool.execute(
      `SELECT time, slots, status
       FROM custom_dates
       WHERE service_id = ? AND date = ?`,
      [service_id, date]
    );

    // If full-day block
    if (customRows.some((r) => r.status === "blocked" && r.time === null)) {
      return res.json({ success: true, slots: [] });
    }

    // ---------------- D) Existing appointments ----------------
    const [apptRows] = await pool.execute(
      `SELECT time, COUNT(*) AS booked
       FROM appointments
       WHERE service_id = ? AND date = ? 
         AND status IN ('pending','approved','in_progress','completed')
       GROUP BY time`,
      [service_id, date]
    );

    const bookedMap = {};
    for (const r of apptRows) bookedMap[r.time] = r.booked;

    // ---------------- E) Merge weekly + custom ----------------
    const slotMap = new Map();

    // Add weekly rules
    for (const r of weeklyRows) {
      slotMap.set(r.time, { slots: r.slots, status: "available" });
    }

    // Apply custom overrides
    for (const r of customRows) {
      if (r.status === "blocked") {
        slotMap.delete(r.time);
      } else if (r.status === "available") {
        slotMap.set(r.time, { slots: r.slots, status: "available" });
      }
    }

    // ---------------- F) Calculate availability ----------------
    const result = [];
    for (const [time, meta] of slotMap) {
      const maxSlots = meta.slots ?? 1; // NULL = free-time (1 slot only)
      const booked = bookedMap[time] || 0;
      const available = maxSlots - booked;

      if (available > 0) {
        result.push({
          time,
          slots: maxSlots,
          booked,
          available,
          status: "available",
        });
      } else {
        result.push({
          time,
          slots: maxSlots,
          booked,
          available: 0,
          status: "full",
        });
      }
    }

    // Sort times
    result.sort((a, b) => a.time.localeCompare(b.time));

    res.json({ success: true, slots: result });
  } catch (err) {
    console.error("❌ availability error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
