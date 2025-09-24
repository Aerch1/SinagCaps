// src/controllers/admin/appointments.controller.js
import { Parser } from "json2csv";
import pool from "../../config/db.js";

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

    // ✅ Pull service list from services table
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
      serviceIds = [], // ✅ now use service_id
      date,
      startDate,
      endDate,
      sortBy,
      sortDir,
    } = req.body;

    const offset = (page - 1) * pageSize;
    const where = [];
    const values = [];

    // 🔹 Search query
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

    // 🔹 Status filter
    if (status.length) {
      where.push(`a.status IN (${status.map(() => "?").join(",")})`);
      values.push(...status);
    }

    // 🔹 Service filter
    if (serviceIds.length) {
      where.push(`a.service_id IN (${serviceIds.map(() => "?").join(",")})`);
      values.push(...serviceIds);
    }

    // 🔹 Date filter
    if (startDate && endDate) {
      where.push(`DATE(a.date) BETWEEN ? AND ?`);
      values.push(startDate, endDate);
    } else if (date) {
      where.push(`DATE(a.date) = ?`);
      values.push(date);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // 🔹 Sorting
    let orderSQL = "";
    if (sortBy && sortDir) {
      const SORTABLE = new Set(["id", "name", "date", "status"]);
      const safeKey = SORTABLE.has(sortBy) ? sortBy : "a.id";
      const safeDir = String(sortDir).toLowerCase() === "desc" ? "DESC" : "ASC";
      orderSQL = `ORDER BY ${safeKey} ${safeDir}`;
    } else {
      orderSQL = `ORDER BY a.date DESC, a.time DESC`;
    }

    // 🔹 Queries
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
      party_size = 1,
      status = "pending",
      notes = "",
    } = req.body;

    if (!name || !email || !service_id || !date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO appointments 
         (user_id, name, email, contactNumber, service_id, date, time, party_size, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId || null,
        name,
        email,
        contactNumber || null,
        service_id,
        date,
        time,
        party_size,
        status,
        notes,
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
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
  try {
    const { id } = req.params;
    const { status, date, time, notes } = req.body;

    const [result] = await pool.query(
      `UPDATE appointments
         SET status = COALESCE(?, status),
             date   = COALESCE(?, date),
             time   = COALESCE(?, time),
             notes  = COALESCE(?, notes)
       WHERE id = ?`,
      [status, date, time, notes, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, message: "Appointment updated successfully" });
  } catch (err) {
    console.error("❌ updateAppointmentAdmin error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
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
