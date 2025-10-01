// src/controllers/admin/appointments.controller.js
import { Parser } from "json2csv";
import pool from "../../config/db.js";
import {
  normalizeTime,
  validateAppointmentInput,
  validateAppointmentUpdateInput,
} from "../../utils/validateAppointment.js";

const STATUSES = [
  "pending",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
];

/* ---------------- GET /api/admin/appointments ---------------- */
export const getAppointments = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments`
    );
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [rows] = await pool.query(
      `SELECT 
         a.id, a.name, a.email, a.contactNumber, 
         s.name AS serviceName,
         a.status,
         DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
         a.time, a.notes
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       ORDER BY a.date DESC, a.time DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const [serviceRows] = await pool.query(
      `SELECT id, name FROM services WHERE active = TRUE ORDER BY name ASC`
    );

    res.json({
      data: rows,
      total,
      totalPages,
      meta: {
        services: serviceRows,
        statuses: STATUSES,
      },
    });
  } catch (err) {
    console.error("❌ getAppointments error:", err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

/* ---------------- POST /api/admin/appointments/filter ---------------- */
export const filterAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      query = "",
      status = [],
      serviceIds = [],
      date,
      startDate,
      endDate,
      sortBy,
      sortDir,
    } = req.body;

    const offset = (page - 1) * pageSize;
    const where = [];
    const values = [];

    if (query) {
      const q = `%${String(query).toLowerCase()}%`;
      const isNumeric = /^\d+$/.test(String(query));
      where.push(
        `(LOWER(a.name) LIKE ? OR LOWER(a.email) LIKE ? OR CAST(a.id AS CHAR) LIKE ?${
          isNumeric ? ` OR a.id = ?)` : `)`
        }`
      );
      values.push(q, q, q);
      if (isNumeric) values.push(Number(query));
    }

    if (status.length) {
      where.push(`a.status IN (${status.map(() => "?").join(",")})`);
      values.push(...status);
    }

    if (serviceIds.length) {
      where.push(`a.service_id IN (${serviceIds.map(() => "?").join(",")})`);
      values.push(...serviceIds);
    }

    if (startDate && endDate) {
      where.push(`DATE(a.date) BETWEEN ? AND ?`);
      values.push(startDate, endDate);
    } else if (date) {
      where.push(`DATE(a.date) = ?`);
      values.push(date);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let orderSQL = "";
    if (sortBy && sortDir) {
      const SORTABLE = new Set(["id", "name", "date", "status"]);
      const safeKey = SORTABLE.has(sortBy) ? sortBy : "a.id";
      const safeDir = String(sortDir).toLowerCase() === "desc" ? "DESC" : "ASC";
      orderSQL = `ORDER BY ${safeKey} ${safeDir}`;
    } else {
      orderSQL = `ORDER BY a.date DESC, a.time DESC`;
    }

    const sqlCount = `SELECT COUNT(*) as total 
                      FROM appointments a 
                      ${whereSQL}`;

    const sqlRows = `
      SELECT 
        a.id, a.name, a.email, a.contactNumber,
        s.name AS serviceName,
        a.status,
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
        a.time, a.notes
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?`;

    const [countRows] = await pool.query(sqlCount, values);
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [rows] = await pool.query(sqlRows, [...values, pageSize, offset]);

    const [serviceRows] = await pool.query(
      `SELECT id, name FROM services WHERE active = TRUE ORDER BY name ASC`
    );

    res.json({
      data: rows,
      total,
      totalPages,
      meta: {
        services: serviceRows,
        statuses: STATUSES,
      },
    });
  } catch (err) {
    console.error("❌ filterAppointments error:", err);
    res.status(500).json({ error: "Failed to filter appointments" });
  }
};

/* ---------------- POST /api/admin/appointments ---------------- */
export const createAppointmentAdmin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      name,
      email,
      contactNumber,
      service_id,
      date,
      time,
      status = "pending",
      notes = "",
      override = false,
    } = req.body;

    const normalizedTime = time ? normalizeTime(time) : null;

    // ✅ Base validation
    const errors = validateAppointmentInput({
      name,
      email,
      contactNumber,
      service_id,
      date,
      time: normalizedTime,
      status,
    });
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      errors.push("Invalid time format (HH:mm expected)");
    }
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ success: false, code: "VALIDATION_ERROR", errors });
    }

    await conn.beginTransaction();

    /* ---------------- 1. Prevent duplicate booking ---------------- */
    const [dupes] = await conn.query(
      `SELECT id FROM appointments
       WHERE service_id = ?
         AND date = ?
         AND time = ?
         AND (email = ? OR contactNumber = ?)
         AND status IN ('pending','approved','in_progress')`,
      [service_id, date, normalizedTime, email, contactNumber]
    );
    if (dupes.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "DOUBLE_BOOKING",
        message: "You already have an appointment at this time.",
      });
    }

    /* ---------------- 2. Check slot capacity ---------------- */
    const [apptCount] = await conn.query(
      `SELECT COUNT(*) as booked
       FROM appointments
       WHERE service_id = ?
         AND date = ?
         AND time = ?
         AND status IN ('pending','approved','in_progress')`,
      [service_id, date, normalizedTime]
    );
    const alreadyBooked = apptCount[0].booked;

    /* ---------------- 3. Get matching rules ---------------- */
    const [rules] = await conn.query(
      `SELECT slots, type, status
       FROM rules
       WHERE service_id = ?
         AND (date = ? OR (date IS NULL AND weekday = WEEKDAY(?)))
       ORDER BY FIELD(type,'blocked','allday','single','recurring')
       LIMIT 1`,
      [service_id, date, date]
    );

    let capacity = 1;
    let blockedByRule = false;

    if (rules.length) {
      const rule = rules[0];
      if (rule.type === "blocked" || rule.status === "blocked") {
        blockedByRule = true;
        capacity = 0;
      } else if (rule.slots != null) {
        capacity = rule.slots;
      }
    }

    /* ---------------- 4. Fully booked check ---------------- */
    if (alreadyBooked >= capacity && capacity > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "FULLY_BOOKED",
        message: "This time is already fully booked.",
      });
    }

    /* ---------------- 5. Outside church hours ---------------- */
    if (!override && (capacity === 0 || blockedByRule)) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        code: "OUTSIDE_HOURS",
        message: "This time is outside church hours. Do you want to continue?",
        confirmNeeded: true,
      });
    }

    /* ---------------- 6. Insert ---------------- */
    const [result] = await conn.query(
      `INSERT INTO appointments 
         (user_id, name, email, contactNumber, service_id, date, time, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId || null,
        name,
        email,
        contactNumber || null,
        service_id,
        date,
        normalizedTime,
        status,
        notes,
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: override
        ? "Appointment created with override"
        : "Appointment created successfully",
      appointmentId: result.insertId,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ createAppointmentAdmin error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create appointment" });
  } finally {
    if (conn) conn.release();
  }
};

/* ---------------- PATCH /api/admin/appointments/:id ---------------- */
export const updateAppointmentAdmin = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      status,
      date,
      time,
      notes,
      name,
      email,
      contactNumber,
      service_id,
      override = false,
    } = req.body;

    const normalizedTime = time ? normalizeTime(time) : null;

    const errors = validateAppointmentUpdateInput({
      ...req.body,
      time: normalizedTime,
    });
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      errors.push("Invalid time format (HH:mm expected)");
    }
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ success: false, code: "VALIDATION_ERROR", errors });
    }

    await conn.beginTransaction();

    /* ---------------- 1. Fetch existing ---------------- */
    const [existingRows] = await conn.query(
      `SELECT service_id, date, time, email, contactNumber
       FROM appointments WHERE id = ?`,
      [id]
    );
    if (!existingRows.length) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Appointment not found",
      });
    }
    const current = existingRows[0];

    const newService = service_id || current.service_id;
    const newDate = date || current.date;
    const newTime = normalizedTime || current.time;

    /* ---------------- 2. If slot changed → validate ---------------- */
    const slotChanged =
      newService !== current.service_id ||
      newDate !== current.date ||
      newTime !== current.time;

    if (slotChanged) {
      // Prevent duplicate booking
      const [dupes] = await conn.query(
        `SELECT id FROM appointments
         WHERE service_id = ?
           AND date = ?
           AND time = ?
           AND (email = ? OR contactNumber = ?)
           AND status IN ('pending','approved','in_progress')
           AND id != ?`,
        [
          newService,
          newDate,
          newTime,
          email || current.email,
          contactNumber || current.contactNumber,
          id,
        ]
      );
      if (dupes.length > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          code: "DOUBLE_BOOKING",
          message: "You already have an appointment at this time.",
        });
      }

      // Count existing bookings
      const [apptCount] = await conn.query(
        `SELECT COUNT(*) as booked
         FROM appointments
         WHERE service_id = ?
           AND date = ?
           AND time = ?
           AND status IN ('pending','approved','in_progress')
           AND id != ?`,
        [newService, newDate, newTime, id]
      );
      const alreadyBooked = apptCount[0].booked;

      // Get rules
      const [rules] = await conn.query(
        `SELECT slots, type, status
         FROM rules
         WHERE service_id = ?
           AND (date = ? OR (date IS NULL AND weekday = WEEKDAY(?)))
         ORDER BY FIELD(type,'blocked','allday','single','recurring')
         LIMIT 1`,
        [newService, newDate, newDate]
      );

      let capacity = 1;
      let blockedByRule = false;
      if (rules.length) {
        const rule = rules[0];
        if (rule.type === "blocked" || rule.status === "blocked") {
          blockedByRule = true;
          capacity = 0;
        } else if (rule.slots != null) {
          capacity = rule.slots;
        }
      }

      // Fully booked
      if (alreadyBooked >= capacity && capacity > 0) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          code: "FULLY_BOOKED",
          message: "This time is already fully booked.",
        });
      }

      // Outside hours
      if (!override && (capacity === 0 || blockedByRule)) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          code: "OUTSIDE_HOURS",
          message:
            "This time is outside church hours. Do you want to continue?",
          confirmNeeded: true,
        });
      }
    }

    /* ---------------- 3. Apply update ---------------- */
    const [result] = await conn.query(
      `UPDATE appointments
         SET status = COALESCE(?, status),
             date   = COALESCE(?, date),
             time   = COALESCE(?, time),
             notes  = COALESCE(?, notes),
             name   = COALESCE(?, name),
             email  = COALESCE(?, email),
             contactNumber = COALESCE(?, contactNumber),
             service_id    = COALESCE(?, service_id)
       WHERE id = ?`,
      [
        status,
        date,
        normalizedTime,
        notes,
        name,
        email,
        contactNumber,
        service_id,
        id,
      ]
    );

    await conn.commit();

    res.json({
      success: true,
      message: override
        ? "Appointment updated with override"
        : "Appointment updated successfully",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ updateAppointmentAdmin error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
  } finally {
    if (conn) conn.release();
  }
};

/* ---------------- GET /api/admin/appointments/:id ---------------- */
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
         a.id, a.name, a.email, a.contactNumber,
         s.name AS serviceName,
         a.status, a.date, a.time, a.notes
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, appointment: rows[0] });
  } catch (err) {
    console.error("❌ getAppointmentById error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointment" });
  }
};

/* ---------------- GET /api/admin/appointments/export ---------------- */
export const exportAppointments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         a.id, a.name, a.email, a.contactNumber,
         s.name AS serviceName,
         a.status,
         DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
         a.time
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       ORDER BY a.date ASC, a.time ASC`
    );

    const parser = new Parser({
      fields: [
        "id",
        "name",
        "email",
        "contactNumber",
        "serviceName",
        "status",
        "date",
        "time",
      ],
    });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("appointments.csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ exportAppointments error:", err);
    res.status(500).json({ error: "Failed to export appointments" });
  }
};
