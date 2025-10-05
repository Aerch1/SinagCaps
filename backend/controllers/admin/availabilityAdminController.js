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

/* ==================================================
   Conflict / Duplication Helper
================================================== */
async function checkConflicts(payload, excludeId = null) {
  const {
    service_id,
    date,
    weekday,
    type,
    time,
    start,
    end,
    interval_mins,
    override,
  } = payload;

  // 🔹 AllDay / Blocked exclusivity (per date OR weekday only)
  if ((type === "allday" || type === "blocked") && !override) {
    let conflicts;
    if (date) {
      [conflicts] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND date=? 
           AND type IN ('allday','blocked')
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId ? [service_id, date, excludeId] : [service_id, date]
      );
    } else if (weekday != null) {
      [conflicts] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND weekday=? 
           AND date IS NULL
           AND type IN ('allday','blocked')
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId ? [service_id, weekday, excludeId] : [service_id, weekday]
      );
    } else {
      conflicts = [];
    }

    if (conflicts.length > 0) {
      return [
        "Existing rule for this date/weekday found. Use override to replace it with all day/blocked.",
      ];
    }
  }

  // 🔹 Prevent adding time-based slots if AllDay already exists
  if (type === "single" || type === "recurring") {
    let allDayAvail;
    if (date) {
      [allDayAvail] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND date=? 
           AND type='allday' AND status='available'
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId ? [service_id, date, excludeId] : [service_id, date]
      );
    } else if (weekday != null) {
      [allDayAvail] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND weekday=? AND date IS NULL
           AND type='allday' AND status='available'
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId ? [service_id, weekday, excludeId] : [service_id, weekday]
      );
    } else {
      allDayAvail = [];
    }

    if (allDayAvail.length > 0) {
      return [
        "This date/weekday is already set as All Day available. No need to add specific slots.",
      ];
    }
  }

  // 🔹 Duplicate SINGLE slot
  if (type === "single" && time) {
    let dupes = [];
    if (date) {
      [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND type='single' AND time=? 
           AND date=? 
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId
          ? [service_id, time, date, excludeId]
          : [service_id, time, date]
      );
    } else if (weekday != null) {
      [dupes] = await pool.execute(
        `SELECT id FROM rules
         WHERE service_id=? AND type='single' AND time=? 
           AND weekday=? AND date IS NULL
         ${excludeId ? "AND id <> ?" : ""}`,
        excludeId
          ? [service_id, time, weekday, excludeId]
          : [service_id, time, weekday]
      );
    }

    if (dupes.length > 0) return ["A slot already exists at this time."];
  }

  return [];
}

/* ==================================================
   ADD RULE
================================================== */
export const addRule = async (req, res) => {
  const { serviceId } = req.params;
  const payload = { ...req.body, service_id: serviceId };

  // ✅ Ensure single rules always have at least 1 slot
  if (payload.type === "single" && (!payload.slots || payload.slots <= 0)) {
    payload.slots = 1;
  }

  const errors = validateRule(payload);
  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  try {
    const conflictErrors = await checkConflicts(payload);
    if (conflictErrors.length > 0) {
      return res.status(400).json({ success: false, errors: conflictErrors });
    }

    if (
      (payload.type === "allday" || payload.type === "blocked") &&
      payload.override
    ) {
      if (payload.date) {
        await pool.execute(
          `DELETE FROM rules WHERE service_id=? AND date=?`,
          [serviceId, payload.date]
        );
      } else if (payload.weekday != null) {
        await pool.execute(
          `DELETE FROM rules WHERE service_id=? AND weekday=? AND date IS NULL`,
          [serviceId, payload.weekday]
        );
      }
    }

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
      rule: { id: result.insertId, service_id: serviceId, ...payload },
    });
  } catch (err) {
    console.error("❌ addRule", err);
    res.status(500).json({ success: false, error: "Failed to add rule" });
  }
};

/* ==================================================
   UPDATE RULE
================================================== */
export const updateRule = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT service_id FROM rules WHERE id=?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }
    const service_id = rows[0].service_id;

    const payload = { ...req.body, id, service_id };

    // ✅ Ensure single rules always have at least 1 slot
    if (payload.type === "single" && (!payload.slots || payload.slots <= 0)) {
      payload.slots = 1;
    }

    const errors = validateRule(payload);
    if (errors.length > 0)
      return res.status(400).json({ success: false, errors });

    const conflictErrors = await checkConflicts(payload, id);
    if (conflictErrors.length > 0) {
      return res.status(400).json({ success: false, errors: conflictErrors });
    }

    if (
      (payload.type === "allday" || payload.type === "blocked") &&
      payload.override
    ) {
      if (payload.date) {
        await pool.execute(
          `DELETE FROM rules WHERE service_id=? AND date=? AND id <> ?`,
          [service_id, payload.date, id]
        );
      } else if (payload.weekday != null) {
        await pool.execute(
          `DELETE FROM rules WHERE service_id=? AND weekday=? AND date IS NULL AND id <> ?`,
          [service_id, payload.weekday, id]
        );
      }
    }

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

    res.json({ success: true, rule: { id, ...payload } });
  } catch (err) {
    console.error("❌ updateRule", err);
    res.status(500).json({ success: false, error: "Failed to update rule" });
  }
};




/* ==================================================
   DELETE RULE
================================================== */
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

/* ==================================================
   TOGGLE BLOCK WEEKDAY
================================================== */
export const toggleBlockWeekday = async (req, res) => {
  const { serviceId, weekday } = req.params;
  const { blocked } = req.body; // true = block, false = unblock

  try {
    if (blocked) {
      // Only delete weekly rules (date IS NULL) for that weekday
      await pool.execute(
        `DELETE FROM rules 
         WHERE service_id=? AND weekday=? AND date IS NULL`,
        [serviceId, weekday]
      );

      // Insert the "blocked" weekly rule
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
      // Remove only the blocked weekly rule (leave custom rules intact)
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
