import pool from "../config/db.js";
import {
  AppError,
  handleAsyncError,
  sendResponse,
} from "../utils/errorHandler.js";

/* Utilities */
const pad2 = (n) => String(n).padStart(2, "0");
const monthKey = (y, m) => `${y}-${pad2(m)}`; // m = 1..12
const toISO = (d) => d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m=1..12

/* ---- GET /api/availability/:service/:year/:month ---- */
export const getMonthAvailability = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const year = Number(req.params.year);
  const month = Number(req.params.month); // 1..12

  if (!service || !year || !month) throw new AppError("Invalid params", 400);

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const isoStart = toISO(first);
  const isoEnd = toISO(last);

  let conn;
  try {
    conn = await pool.getConnection();

    // 1) templates
    const [templates] = await conn.execute(
      `SELECT weekday, time_12h, default_slots
       FROM availability_templates
       WHERE service = ?`,
      [service]
    );

    // Map: weekday -> [{time, slots}]
    const weeklyMap = new Map(); // key: 0..6
    for (const row of templates) {
      const arr = weeklyMap.get(row.weekday) || [];
      arr.push({ time: row.time_12h, slots: row.default_slots });
      weeklyMap.set(row.weekday, arr);
    }

    // 2) weekly blocks
    const [weekBlocks] = await conn.execute(
      `SELECT weekday FROM availability_weekly_blocks WHERE service = ?`,
      [service]
    );
    const blockedWeekdays = new Set(weekBlocks.map((r) => r.weekday));

    // 3) overrides within month
    const [overrides] = await conn.execute(
      `SELECT date, status, times, time_capacity
       FROM availability_overrides
       WHERE service = ? AND date BETWEEN ? AND ?`,
      [service, isoStart, isoEnd]
    );
    const overrideMap = new Map(); // dateISO -> {status, times[], timeCapacity{}}
    for (const row of overrides) {
      overrideMap.set(toISO(new Date(row.date)), {
        status: row.status || null,
        times: row.times ? JSON.parse(row.times) : undefined, // note: undefined means "not set"
        timeCapacity: row.time_capacity ? JSON.parse(row.time_capacity) : {},
      });
    }

    // 4) appointments -> booked counts
    const [bookings] = await conn.execute(
      `SELECT preferred_date AS date, preferred_time AS time, SUM(party_size) AS booked
       FROM appointments
       WHERE service = ?
         AND status IN ('pending','approved')
         AND preferred_date BETWEEN ? AND ?
       GROUP BY preferred_date, preferred_time`,
      [service, isoStart, isoEnd]
    );
    const bookedMap = new Map(); // 'YYYY-MM-DD|TIME' -> bookedInt
    for (const b of bookings) {
      const key = `${toISO(new Date(b.date))}|${b.time}`;
      bookedMap.set(key, Number(b.booked) || 0);
    }

    // helper: compute times + capacity for a date
    const baseTimesForDate = (d) => {
      const dow = d.getDay();
      const iso = toISO(d);
      const ov = overrideMap.get(iso);

      // override times replace entirely if present (can be [])
      if (ov && Object.prototype.hasOwnProperty.call(ov, "times")) {
        return (ov.times || []).map((t) => ({
          time: t,
          cap: ov.timeCapacity?.[t] ?? 0,
        }));
      }

      // else use weekly template
      const arr = weeklyMap.get(dow) || [];
      return arr.map((x) => ({ time: x.time, cap: x.slots }));
    };

    const monthStr = monthKey(year, month);
    const days = [];

    for (let day = 1; day <= daysInMonth(year, month); day++) {
      const d = new Date(year, month - 1, day);
      const iso = toISO(d);
      const dow = d.getDay();
      const ov = overrideMap.get(iso);

      // status precedence:
      // 1) blocked weekday
      if (blockedWeekdays.has(dow)) {
        days.push({ date: iso, status: "blocked", times: [] });
        continue;
      }
      // 2) override blocked
      if (ov?.status === "blocked") {
        days.push({ date: iso, status: "blocked", times: [] });
        continue;
      }
      // 3) override unavailable
      if (ov?.status === "unavailable") {
        const times =
          ov && Object.prototype.hasOwnProperty.call(ov, "times")
            ? ov.times || []
            : [];
        days.push({ date: iso, status: "unavailable", times });
        continue;
      }

      // 4) scheduled by template or override times
      const timesCap = baseTimesForDate(d); // [{time, cap}]
      if (!timesCap.length) {
        // neutral: omit entirely (your UI treats missing as 'neutral')
        continue;
      }

      // compute left for each time
      const times = [];
      let anyLeft = false;
      for (const { time, cap } of timesCap) {
        const booked = bookedMap.get(`${iso}|${time}`) || 0;
        const left = Math.max(0, (Number(cap) || 0) - booked);
        if (left > 0) anyLeft = true;
        times.push({ time, left, capacity: Number(cap) || 0 });
      }

      days.push({
        date: iso,
        status: anyLeft ? "available" : "unavailable",
        times,
      });
    }

    return sendResponse(res, 200, true, "OK", {
      month: monthStr,
      days,
    });
  } finally {
    if (conn) conn.release();
  }
});

/* ---- GET /api/availability/:service/day/:isoDate ---- */
export const getDayTimes = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const iso = String(req.params.isoDate || "").trim(); // 'YYYY-MM-DD'
  if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(iso))
    throw new AppError("Invalid params", 400);

  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;

  // Reuse the month builder to stay consistent
  req.params.year = String(y);
  req.params.month = String(m);
  const fakeRes = {
    json: (payload) => payload,
    status: () => fakeRes,
  };
  const data = await getMonthAvailability(
    { ...req, params: { service, year: y, month: m } },
    fakeRes
  );
  const day = data?.data?.days?.find((x) => x.date === iso) || {
    status: "neutral",
    times: [],
  };

  return sendResponse(res, 200, true, "OK", day);
});

/* ---- POST /api/availability/:service (admin) ----
Body example:
{
  "weekdays": { "0": [{"time":"11:00 AM","slots":8}], "6": [{"time":"09:00 AM","slots":6}] },
  "blockedWeekdays": [1,2],   // Monday, Tuesday blocked (optional)
  "overrides": [              // optional for future
    {"date":"2025-09-13","status":"available","times":["08:00 AM"],"timeCapacity":{"08:00 AM":9}}
  ]
}
*/
export const updateWeeklyAvailability = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  if (!service) throw new AppError("Invalid service", 400);

  const weekdays = req.body?.weekdays || {}; // { dow: [{time, slots}] }
  const blockedWeekdays = req.body?.blockedWeekdays || []; // [dow,...]
  const overrides = req.body?.overrides || []; // optional

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Replace templates
    await conn.execute(`DELETE FROM availability_templates WHERE service = ?`, [
      service,
    ]);

    for (const [dowStr, entries] of Object.entries(weekdays)) {
      const dow = Number(dowStr);
      for (const e of entries || []) {
        await conn.execute(
          `INSERT INTO availability_templates (service, weekday, time_12h, default_slots)
           VALUES (?, ?, ?, ?)`,
          [service, dow, String(e.time), Number(e.slots) || 0]
        );
      }
    }

    // Replace weekly blocks
    await conn.execute(
      `DELETE FROM availability_weekly_blocks WHERE service = ?`,
      [service]
    );
    for (const dow of blockedWeekdays) {
      await conn.execute(
        `INSERT INTO availability_weekly_blocks (service, weekday) VALUES (?, ?)`,
        [service, Number(dow)]
      );
    }

    // (Optional) Upsert overrides
    for (const o of overrides) {
      await conn.execute(
        `INSERT INTO availability_overrides (service, date, status, times, time_capacity)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), times=VALUES(times), time_capacity=VALUES(time_capacity)`,
        [
          service,
          o.date,
          o.status || null,
          o.hasOwnProperty("times") ? JSON.stringify(o.times || []) : null,
          o.timeCapacity ? JSON.stringify(o.timeCapacity) : null,
        ]
      );
    }

    await conn.commit();
    return sendResponse(res, 200, true, "Availability saved");
  } catch (e) {
    if (conn) await conn.rollback();
    throw e;
  } finally {
    if (conn) conn.release();
  }
});

// controllers/availability.controller.js (add these)

// POST /api/availability/:service/templates
export const upsertWeeklyTemplate = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const weekdays = req.body?.weekdays || {}; // { "0": [{time, slots}], ... }
  if (!service) throw new AppError("Invalid service", 400);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.execute(`DELETE FROM availability_templates WHERE service = ?`, [
      service,
    ]);
    for (const [dowStr, entries] of Object.entries(weekdays)) {
      const dow = Number(dowStr);
      for (const e of entries || []) {
        await conn.execute(
          `INSERT INTO availability_templates (service, weekday, time_12h, default_slots)
           VALUES (?, ?, ?, ?)`,
          [service, dow, String(e.time), Number(e.slots) || 0]
        );
      }
    }

    await conn.commit();
    return sendResponse(res, 200, true, "Templates saved");
  } catch (e) {
    if (conn) await conn.rollback();
    throw e;
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/availability/:service/weekly-blocks
export const upsertWeeklyBlock = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const blockedWeekdays = req.body?.blockedWeekdays || []; // [0..6]
  if (!service) throw new AppError("Invalid service", 400);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.execute(
      `DELETE FROM availability_weekly_blocks WHERE service = ?`,
      [service]
    );
    for (const dow of blockedWeekdays) {
      await conn.execute(
        `INSERT INTO availability_weekly_blocks (service, weekday) VALUES (?, ?)`,
        [service, Number(dow)]
      );
    }

    await conn.commit();
    return sendResponse(res, 200, true, "Weekly blocks saved");
  } catch (e) {
    if (conn) await conn.rollback();
    throw e;
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/availability/:service/overrides
export const upsertDateOverride = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const { date, status, times, timeCapacity } = req.body || {};
  if (!service || !date) throw new AppError("service and date required", 400);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.execute(
      `INSERT INTO availability_overrides (service, date, status, times, time_capacity)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), times=VALUES(times), time_capacity=VALUES(time_capacity)`,
      [
        service,
        date,
        status || null,
        Object.prototype.hasOwnProperty.call(req.body || {}, "times")
          ? JSON.stringify(times || [])
          : null,
        timeCapacity ? JSON.stringify(timeCapacity) : null,
      ]
    );
    return sendResponse(res, 200, true, "Override saved");
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/availability/:service/overrides/:date
export const deleteDateOverride = handleAsyncError(async (req, res) => {
  const service = String(req.params.service || "").trim();
  const date = String(req.params.date || "").trim();
  if (!service || !date) throw new AppError("service and date required", 400);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.execute(
      `DELETE FROM availability_overrides WHERE service = ? AND date = ?`,
      [service, date]
    );
    return sendResponse(res, 200, true, "Override deleted");
  } finally {
    if (conn) conn.release();
  }
});
