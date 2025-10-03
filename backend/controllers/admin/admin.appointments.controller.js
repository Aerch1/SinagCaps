import { Parser } from "json2csv";
import pool from "../../config/db.js";
import {
  normalizeTime,
  validateCreate,
  validateUpdate,
} from "../../utils/validateAppointment.js";
import {
  getDayAvailability,
  needsConfirmationForAdmin,
  findSlot,
} from "../../services/availability.service.js";
import {
  hasDuplicateBooking,
  countBookedAt,
  insertAppointment,
  updateAppointment as applyUpdate,
} from "../../services/appointments.service.js";
import { sendAppointmentCreatedEmail } from "../../utils/appointmentEmails.js";

const STATUSES = [
  "pending",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
];

/* ==================================================
   POST /api/admin/appointments
================================================== */
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
      address = null,
      status = "pending",
      notes = null,
      override = false,
    } = req.body;

    const t = normalizeTime(time);
    const errors = validateCreate({
      name,
      email,
      contactNumber,
      address,
      service_id,
      date,
      time: t,
    });
    if (t === null) errors.push("Invalid time format (HH:mm).");
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, code: "VALIDATION_ERROR", errors });
    }

    await conn.beginTransaction();

    if (
      await hasDuplicateBooking({
        service_id,
        date,
        time: t,
        email,
        contactNumber,
      })
    ) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "DOUBLE_BOOKING",
        message: "You already have an appointment at this time.",
      });
    }

    const dayAvail = await getDayAvailability(service_id, date);
    const slot = findSlot(dayAvail, t);
    if (slot && slot.unavailable) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "FULLY_BOOKED",
        message: "This time is already fully booked.",
      });
    }

    const confirm = needsConfirmationForAdmin({
      availability: dayAvail,
      timeHHMM: t,
    });
    if (confirm.needed && !override) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        code: "CONFIRM_REQUIRED",
        message: confirm.reasonText,
        confirmNeeded: true,
        meta: { reason: confirm.reasonText, reasonCode: confirm.reasonCode },
      });
    }

    if (slot) {
      const alreadyBooked = await countBookedAt({ service_id, date, time: t });
      const remaining = Math.max(
        0,
        slot.remaining ?? slot.capacity - alreadyBooked
      );
      if (remaining <= 0 && !override) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          code: "FULLY_BOOKED",
          message: "This time is already fully booked.",
        });
      }
    }

    const newId = await insertAppointment({
      user_id: req.userId || null,
      name,
      email,
      contactNumber,
      address,
      service_id,
      date,
      time: t,
      status,
      notes: notes || null,
    });

    await conn.commit();

    try {
      const [[service]] = await conn.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      await sendAppointmentCreatedEmail(email, {
        name,
        serviceName: service?.name || "Selected Service",
        date,
        time: t,
        appointmentId: newId,
      });
    } catch (e) {
      console.error("sendAppointmentCreatedEmail failed (admin):", e.message);
    }

    return res.status(201).json({
      success: true,
      message: override
        ? "Appointment created with override"
        : "Appointment created successfully",
      appointmentId: newId,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ createAppointmentAdmin error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create appointment" });
  } finally {
    if (conn) conn.release();
  }
};

/* ==================================================
   PATCH /api/admin/appointments/:id
================================================== */
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
      address,
      service_id,
      override = false,
    } = req.body;

    const t = time ? normalizeTime(time) : null;
    const errors = validateUpdate({ status, date, time: t });
    if (t === null && time) errors.push("Invalid time format (HH:mm).");
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, code: "VALIDATION_ERROR", errors });
    }

    await conn.beginTransaction();
    await applyUpdate({
      id,
      status,
      date: date ?? null,
      time: t ?? null,
      notes: notes || null,
      name,
      email,
      contactNumber,
      address,
      service_id,
    });
    await conn.commit();

    try {
      const [[service]] = await conn.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      await sendAppointmentStatusEmail(email, {
        name,
        serviceName: service?.name || "Selected Service",
        date,
        time: t,
        status,
        appointmentId: id,
      });
    } catch (e) {
      console.error("sendAppointmentStatusEmail failed:", e.message);
    }

    return res.json({
      success: true,
      message: override
        ? "Appointment updated with override"
        : "Appointment updated successfully",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ updateAppointmentAdmin error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update appointment" });
  } finally {
    if (conn) conn.release();
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Appointment (common fields only, plus service)
    const [[appt]] = await pool.execute(
      `SELECT 
         a.id,
         a.name,
         a.email,
         a.contactNumber,
         a.address,
         a.status,
         a.date,
         a.time,
         a.notes,
         a.created_at AS createdAt,
         s.name AS serviceName,
         s.form_type
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.id=?`,
      [id]
    );

    if (!appt) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    let details = null;
    let sponsors = [];

    // 🔵 Extra: Baptism details & sponsors (clean fields only)
    if (appt.form_type === "baptism") {
      [[details]] = await pool.execute(
        `SELECT 
           childFullName,
           childDob,
           childBirthplace,
           fatherName,
           motherMaidenName,
           parentsMarriageType
         FROM baptism_details 
         WHERE appointment_id=?`,
        [id]
      );

      if (details) {
        const [sponsorRows] = await pool.execute(
          `SELECT 
             role, 
             name, 
             address
           FROM baptism_sponsors 
           WHERE baptism_id = (
             SELECT id FROM baptism_details WHERE appointment_id=? LIMIT 1
           )`,
          [id]
        );
        sponsors = sponsorRows;
      }
    }

    return res.json({
      success: true,
      appointment: appt, // ✅ includes Transaction ID, service, status, createdAt
      details,           // ✅ clean fields (no id, no created_at)
      sponsors,          // ✅ clean fields (no id, no created_at)
    });
  } catch (err) {
    console.error("❌ getAppointmentById error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointment" });
  }
};


/* ==================================================
   GET /api/admin/appointments
   → List appointments (common fields only)
================================================== */
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
         a.id, a.name, a.email, a.contactNumber, a.address,
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
      success: true,
      data: rows,
      total,
      totalPages,
      meta: { services: serviceRows, statuses: STATUSES },
    });
  } catch (err) {
    console.error("❌ getAppointments error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch appointments" });
  }
};

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
        `(LOWER(a.name) LIKE ? 
          OR LOWER(a.email) LIKE ? 
          OR LOWER(a.address) LIKE ? 
          OR CAST(a.id AS CHAR) LIKE ?${isNumeric ? ` OR a.id = ?)` : `)`}`
      );
      values.push(q, q, q, q);
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

    const sqlCount = `SELECT COUNT(*) as total FROM appointments a ${whereSQL}`;
    const sqlRows = `
      SELECT 
        a.id, a.name, a.email, a.contactNumber, a.address,
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
      success: true,
      data: rows,
      total,
      totalPages,
      meta: { services: serviceRows, statuses: STATUSES },
    });
  } catch (err) {
    console.error("❌ filterAppointments error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to filter appointments" });
  }
};

/* ==================================================
   GET /api/admin/appointments/export
   → Export as CSV
================================================== */
export const exportAppointments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         a.id, a.name, a.email, a.contactNumber, a.address,
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
        "address",
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
