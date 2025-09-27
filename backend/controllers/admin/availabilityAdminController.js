import pool from "../../config/db.js";
import { validateRule } from "../../utils/validateRule.js";

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
  const payload = { ...req.body, service_id: serviceId };

  // 🔹 Run validation
  const errors = validateRule(payload);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // 🔹 Exclusivity check for allday/blocked
    if (payload.type === "allday" || payload.type === "blocked") {
      const [conflicts] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND (date <=> ? OR weekday <=> ?)`,
        [serviceId, payload.date ?? null, payload.weekday ?? null]
      );
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          errors: [
            "All day/blocked rules override existing rules. Please delete or override first.",
          ],
        });
      }
    }

    // 🔹 Duplicate-time validation (SINGLE & RECURRING)
    if (payload.type === "single") {
      const [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? 
           AND type='single'
           AND time=? 
           AND (date <=> ? OR weekday <=> ?)`,
        [serviceId, payload.time, payload.date ?? null, payload.weekday ?? null]
      );
      if (dupes.length > 0) {
        return res.status(400).json({
          success: false,
          errors: ["A slot already exists at this time."],
        });
      }
    }

    if (payload.type === "recurring") {
      const [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? 
           AND type='recurring'
           AND start=? AND end=? AND interval_mins=? 
           AND (date <=> ? OR weekday <=> ?)`,
        [
          serviceId,
          payload.start,
          payload.end,
          payload.interval_mins,
          payload.date ?? null,
          payload.weekday ?? null,
        ]
      );
      if (dupes.length > 0) {
        return res.status(400).json({
          success: false,
          errors: ["A recurring schedule already exists for this range."],
        });
      }
    }

    // ✅ Insert Rule
    const [result] = await pool.execute(
      `INSERT INTO rules
        (service_id, weekday, date, type, time, start, end, interval_mins, slots, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceId,
        payload.weekday ?? null,
        payload.date ?? null,
        payload.type,
        payload.type === "single" ? payload.time || null : null,
        payload.type === "recurring" || payload.type === "allday"
          ? payload.start || null
          : null,
        payload.type === "recurring" || payload.type === "allday"
          ? payload.end || null
          : null,
        payload.type === "recurring" ? payload.interval_mins || null : null,
        payload.slots ?? null,
        payload.status || "available",
      ]
    );

    res.json({
      success: true,
      rule: {
        id: result.insertId,
        service_id: serviceId,
        ...payload,
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
  const payload = { ...req.body, id };

  // 🔹 Run validation
  const errors = validateRule(payload);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // 🔹 Exclusivity check for allday/blocked
    if (payload.type === "allday" || payload.type === "blocked") {
      const [conflicts] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? 
           AND (date <=> ? OR weekday <=> ?)
           AND id <> ?`,
        [payload.service_id, payload.date ?? null, payload.weekday ?? null, id]
      );
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          errors: [
            "All day/blocked rules override existing rules. Please delete or override first.",
          ],
        });
      }
    }

    // 🔹 Duplicate-time validation on UPDATE
    if (payload.type === "single") {
      const [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? 
           AND type='single'
           AND time=? 
           AND (date <=> ? OR weekday <=> ?)
           AND id <> ?`,
        [
          payload.service_id,
          payload.time,
          payload.date ?? null,
          payload.weekday ?? null,
          id,
        ]
      );
      if (dupes.length > 0) {
        return res.status(400).json({
          success: false,
          errors: ["A slot already exists at this time."],
        });
      }
    }

    if (payload.type === "recurring") {
      const [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? 
           AND type='recurring'
           AND start=? AND end=? AND interval_mins=? 
           AND (date <=> ? OR weekday <=> ?)
           AND id <> ?`,
        [
          payload.service_id,
          payload.start,
          payload.end,
          payload.interval_mins,
          payload.date ?? null,
          payload.weekday ?? null,
          id,
        ]
      );
      if (dupes.length > 0) {
        return res.status(400).json({
          success: false,
          errors: ["A recurring schedule already exists for this range."],
        });
      }
    }

    // ✅ Update Rule
    await pool.execute(
      `UPDATE rules
       SET weekday=?, date=?, type=?, time=?, start=?, end=?, interval_mins=?, slots=?, status=?
       WHERE id=?`,
      [
        payload.weekday ?? null,
        payload.date ?? null,
        payload.type,
        payload.type === "single" ? payload.time || null : null,
        payload.type === "recurring" || payload.type === "allday"
          ? payload.start || null
          : null,
        payload.type === "recurring" || payload.type === "allday"
          ? payload.end || null
          : null,
        payload.type === "recurring" ? payload.interval_mins || null : null,
        payload.slots ?? null,
        payload.status || "available",
        id,
      ]
    );

    res.json({
      success: true,
      rule: {
        id,
        ...payload,
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
      // 🔹 Delete ALL existing rules for this weekday (weekly + custom overrides)
      await pool.execute(
        `DELETE FROM rules 
         WHERE service_id=? AND (weekday=? OR (date IS NOT NULL AND DAYOFWEEK(date)-1=?))`,
        [serviceId, weekday, weekday] // DAYOFWEEK()-1 to align JS weekday 0=Sun
      );

      // 🔹 Insert the "blocked" rule
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
    } else {
      // 🔹 Remove only the blocked rule
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
