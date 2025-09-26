import pool from "../../config/db.js";

/* ==================================================
   RULES CONTROLLER (weekly + custom unified)
================================================== */

// GET /api/admin/availability/:serviceId/rules
export const getRules = async (req, res) => {
  const { serviceId } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT * 
       FROM rules 
       WHERE service_id=? 
       ORDER BY COALESCE(date, '0000-00-00'), weekday, time, start`,
      [serviceId]
    );
    res.json({ success: true, rules: rows });
  } catch (err) {
    console.error("❌ getRules", err);
    res.status(500).json({ success: false, error: "Failed to fetch rules" });
  }
};

// POST /api/admin/availability/:serviceId/rules
export const addRule = async (req, res) => {
  const { serviceId } = req.params;
  const {
    weekday,
    date,
    type,
    time,
    start,
    end,
    interval_mins,
    slots,
    status,
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO rules
        (service_id, weekday, date, type, time, start, end, interval_mins, slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceId,
        weekday ?? null,
        date ?? null,
        type,
        type === "single" ? time || null : null,
        type === "recurring" || type === "allday" ? start || null : null,
        type === "recurring" || type === "allday" ? end || null : null,
        type === "recurring" ? interval_mins || null : null,
        slots ?? null,
        status || "available",
      ]
    );

    res.json({
      success: true,
      rule: {
        id: result.insertId,
        service_id: serviceId,
        weekday: weekday ?? null,
        date: date ?? null,
        type,
        time: type === "single" ? time || null : null,
        start: type === "recurring" || type === "allday" ? start || null : null,
        end: type === "recurring" || type === "allday" ? end || null : null,
        interval_mins: type === "recurring" ? interval_mins || null : null,
        slots: slots ?? null,
        status: status || "available",
      },
    });
  } catch (err) {
    console.error("❌ addRule", err);
    res.status(500).json({ success: false, error: "Failed to add rule" });
  }
};

// PUT /api/admin/availability/rules/:id
export const updateRule = async (req, res) => {
  const { id } = req.params;
  const {
    weekday,
    date,
    type,
    time,
    start,
    end,
    interval_mins,
    slots,
    status,
  } = req.body;

  try {
    await pool.execute(
      `UPDATE rules
       SET weekday=?, date=?, type=?, time=?, start=?, end=?, interval_mins=?, slots=?, status=?
       WHERE id=?`,
      [
        weekday ?? null,
        date ?? null,
        type,
        type === "single" ? time || null : null,
        type === "recurring" || type === "allday" ? start || null : null,
        type === "recurring" || type === "allday" ? end || null : null,
        type === "recurring" ? interval_mins || null : null,
        slots ?? null,
        status || "available",
        id,
      ]
    );

    res.json({
      success: true,
      rule: {
        id,
        weekday: weekday ?? null,
        date: date ?? null,
        type,
        time: type === "single" ? time || null : null,
        start: type === "recurring" || type === "allday" ? start || null : null,
        end: type === "recurring" || type === "allday" ? end || null : null,
        interval_mins: type === "recurring" ? interval_mins || null : null,
        slots: slots ?? null,
        status: status || "available",
      },
    });
  } catch (err) {
    console.error("❌ updateRule", err);
    res.status(500).json({ success: false, error: "Failed to update rule" });
  }
};

// DELETE /api/admin/availability/rules/:id
export const deleteRule = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(`DELETE FROM rules WHERE id=?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteRule", err);
    res.status(500).json({ success: false, error: "Failed to delete rule" });
  }
};

// PATCH /api/admin/availability/:serviceId/block/:weekday
export const toggleBlockWeekday = async (req, res) => {
  const { serviceId, weekday } = req.params;
  const { blocked } = req.body; // true = block, false = unblock

  try {
    if (blocked) {
      const [rows] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND weekday=? 
           AND date IS NULL
           AND type='allday' AND status='blocked'`,
        [serviceId, weekday]
      );
      if (rows.length === 0) {
        const [result] = await pool.execute(
          `INSERT INTO rules 
             (service_id, weekday, date, type, status, time, slots)
           VALUES (?, ?, NULL, 'allday', 'blocked', NULL, NULL)`,
          [serviceId, weekday]
        );
        return res.json({
          success: true,
          rule: {
            id: result.insertId,
            service_id: serviceId,
            weekday: Number(weekday),
            date: null,
            status: "blocked",
            type: "allday",
            time: null,
            slots: null,
          },
        });
      }
    } else {
      await pool.execute(
        `DELETE FROM rules 
         WHERE service_id=? AND weekday=? 
           AND date IS NULL
           AND type='allday' AND status='blocked'`,
        [serviceId, weekday]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ toggleBlockWeekday", err);
    res.status(500).json({ success: false, error: "Failed to toggle block" });
  }
};
