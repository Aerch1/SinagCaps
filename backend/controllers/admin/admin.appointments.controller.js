// src/controllers/admin/admin.appointments.controller.js
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
import {
  sendAppointmentCreatedEmail,
  sendAppointmentUpdatedEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCancelledEmail,
} from "../../utils/appointmentEmails.js";

import { createNotification } from "../../utils/createNotification.js";

// ✅ Updated statuses (removed in_progress)
// ✅ Updated statuses (added archived)
const STATUSES = [
  "pending",
  "approved",
  "completed",
  "cancelled",
  "rejected",
  "archived", // ✅ now supported
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

    // 🔹 Conflict check
    const [conflicts] = await conn.query(
      `SELECT id, name, time, status
       FROM appointments
       WHERE service_id=? AND date=? 
         AND status IN ('pending','approved')
         AND ABS(TIME_TO_SEC(TIMEDIFF(time, ?))) < 3600`,
      [service_id, date, t]
    );
    if (conflicts.length && !override) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        code: "TIME_CONFLICT",
        message: `There is another appointment near ${t}. Do you want to continue anyway?`,
        conflicts,
      });
    }

    // 🔹 Duplicate booking check
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

    // 🔹 Slot validation
    const dayAvail = await getDayAvailability(service_id, date);
    const slot = findSlot(dayAvail, t);
    if (slot && slot.unavailable && !override) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "FULLY_BOOKED",
        message: "This time is already fully booked.",
      });
    }

    // 🔹 Church schedule confirmation
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
      });
    }

    // ✅ Create appointment
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
      notes,
    });
    await conn.commit();

    // 🔹 Send email confirmation
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
      console.error("sendAppointmentCreatedEmail failed:", e.message);
    }

    // ✅ Notify all admins with reference ID + Transaction ID
    try {
      const [admins] = await conn.query(
        "SELECT id FROM users WHERE role='admin'"
      );
      const [[service]] = await conn.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      const message = `${name} booked a ${
        service?.name || "service"
      } on ${date} at ${t}.`;

      for (const admin of admins) {
        await createNotification({
          user_id: admin.id,
          title: "New Appointment Created",
          message,
          type: "appointment",
          reference_id: newId,
          transaction_id: `APT-${String(newId).padStart(5, "0")}`,
        });
      }
    } catch (err) {
      console.warn("⚠️ Failed to create admin notification:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
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
   (approve / reject / cancel / reschedule / update)
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
    const schedulingStatuses = ["approved", "completed"];
    if (schedulingStatuses.includes(status)) {
      const errors = validateUpdate({ status, date, time: t });
      if (t === null && time) errors.push("Invalid time format (HH:mm).");
      if (errors.length)
        return res
          .status(400)
          .json({ success: false, code: "VALIDATION_ERROR", errors });
    }

    await conn.beginTransaction();

    // Conflict / Availability check
    if (date && t && status !== "rejected" && status !== "cancelled") {
      const [conflicts] = await conn.query(
        `SELECT id FROM appointments
         WHERE service_id=? AND date=? AND status IN ('pending','approved')
         AND id != ? AND ABS(TIME_TO_SEC(TIMEDIFF(time, ?))) < 3600`,
        [service_id, date, id, t]
      );
      if (conflicts.length && !override) {
        await conn.rollback();
        return res
          .status(409)
          .json({
            success: false,
            code: "TIME_CONFLICT",
            message: "Conflict detected.",
          });
      }
    }

    // Fetch old data
    const [[oldAppt]] = await conn.query(
      "SELECT date, time FROM appointments WHERE id=?",
      [id]
    );

    // Apply update
    await applyUpdate({
      id,
      status,
      date: date ?? oldAppt?.date ?? null,
      time: t ?? oldAppt?.time ?? null,
      notes: notes || null,
      name,
      email,
      contactNumber,
      address,
      service_id,
    });
    await conn.commit();

    // 🔹 Notification logic
    try {
      const [[service]] = await conn.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      const serviceName = service?.name || "Selected Service";
      const baseMsg = `${name}'s ${serviceName} appointment`;

      let title, message;
      if (status === "approved") {
        title = "Appointment Approved";
        message = `${baseMsg} was approved for ${date} at ${t}.`;
      } else if (status === "cancelled") {
        title = "Appointment Cancelled";
        message = `${baseMsg} has been cancelled.`;
      } else if (status === "rejected") {
        title = "Appointment Rejected";
        message = `${baseMsg} was rejected by the admin.`;
      } else if (date && t && (oldAppt.date !== date || oldAppt.time !== t)) {
        title = "Appointment Rescheduled";
        message = `${baseMsg} was rescheduled to ${date} at ${t}.`;
      } else if (status === "completed") {
        title = "Appointment Completed";
        message = `${baseMsg} has been marked as completed.`;
      }

      if (title) {
        await createNotification({
          user_id: req.userId || null,
          title,
          message,
          type: "appointment",
          reference_id: id,
          transaction_id: `APT-${String(id).padStart(5, "0")}`,
        });
      }
    } catch (err) {
      console.warn("⚠️ Failed to create update notification:", err.message);
    }

    // 🔹 Send emails (unchanged)
    try {
      if (email) {
        const [[service]] = await conn.query(
          "SELECT name FROM services WHERE id=?",
          [service_id]
        );
        const serviceName = service?.name || "Selected Service";

        if (
          date &&
          t &&
          (oldAppt.date !== date || oldAppt.time !== t) &&
          status !== "cancelled" &&
          status !== "rejected"
        ) {
          await sendAppointmentRescheduledEmail(email, {
            name,
            serviceName,
            oldDate: oldAppt.date,
            oldTime: oldAppt.time,
            newDate: date,
            newTime: t,
          });
        } else if (status === "cancelled" || status === "rejected") {
          await sendAppointmentCancelledEmail(email, {
            status,
            name,
            serviceName,
            date: date ?? oldAppt.date,
            time: t ?? oldAppt.time,
            reason:
              notes ||
              (status === "cancelled"
                ? "Appointment was cancelled by the parish office."
                : "Appointment was rejected by the parish office."),
          });
        } else {
          await sendAppointmentUpdatedEmail(email, {
            name,
            serviceName,
            date: date ?? oldAppt.date,
            time: t ?? oldAppt.time,
            status,
            appointmentId: id,
          });
        }
      }
    } catch (e) {
      console.error("⚠️ sendAppointmentEmail failed:", e.message);
    }

    return res.json({
      success: true,
      message: `Appointment ${status || "updated"} successfully`,
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

/* ==================================================
   GET /api/admin/appointments/:id
================================================== */
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[appt]] = await pool.execute(
      `SELECT 
         a.id,
         a.service_id,
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

    /* ---------- Baptism details ---------- */
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
          `SELECT role, name, address
           FROM baptism_sponsors 
           WHERE baptism_id = (
             SELECT id FROM baptism_details WHERE appointment_id=? LIMIT 1
           )`,
          [id]
        );
        sponsors = sponsorRows;
      }
    }

    /* ---------- Confirmation (Kumpil) details ---------- */
    if (appt.form_type === "confirmation") {
      [[details]] = await pool.execute(
        `SELECT 
       confirmandName,
       edad,
       fatherName,
       motherMaidenName,
       parishOrigin,
       baptizedAt,
       baptizedOn
     FROM confirmation_details 
     WHERE appointment_id=?`,
        [id]
      );

      if (details) {
        const [sponsorRows] = await pool.execute(
          `SELECT role, name, address
       FROM confirmation_sponsors 
       WHERE confirmation_id = (
         SELECT id FROM confirmation_details WHERE appointment_id=? LIMIT 1
       )`,
          [id]
        );
        sponsors = sponsorRows;
      }
    }

    return res.json({
      success: true,
      appointment: appt,
      details,
      sponsors,
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
================================================== */
export const getAppointments = async (req, res) => {
  try {
    /* =======================================================
       🔹 1️⃣ Auto-mark old approved appointments as completed
    ======================================================= */
    const [outdated] = await pool.query(`
      UPDATE appointments
      SET status = 'completed'
      WHERE status = 'approved'
        AND TIMESTAMP(date, time) < NOW() - INTERVAL 3 DAY
    `);
    if (outdated.affectedRows > 0) {
      console.log(`✅ Auto-completed ${outdated.affectedRows} old appointments`);
    }

    /* =======================================================
       🔹 2️⃣ Fetch today's and tomorrow's appointments
    ======================================================= */
    const [todayRows] = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM appointments 
      WHERE DATE(date) = CURDATE() 
        AND status IN ('pending','approved')
    `);

    const [tomorrowRows] = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM appointments 
      WHERE DATE(date) = CURDATE() + INTERVAL 1 DAY
        AND status IN ('pending','approved')
    `);

    const todayCount = todayRows[0].count || 0;
    const tomorrowCount = tomorrowRows[0].count || 0;

    /* =======================================================
       🔹 3️⃣ Generate randomized messages
    ======================================================= */
    const todayMessages = [
      `You have ${todayCount} appointment${todayCount > 1 ? "s" : ""} scheduled for today.`,
      `${todayCount} appointment${todayCount > 1 ? "s" : ""} are lined up for today — make sure to review them.`,
      `Heads up! ${todayCount} appointment${todayCount > 1 ? "s" : ""} happening today.`,
      `Today’s schedule includes ${todayCount} appointment${todayCount > 1 ? "s" : ""}.`,
      `${todayCount} appointment${todayCount > 1 ? "s" : ""} awaiting attention today.`,
    ];

    const tomorrowMessages = [
      `You have ${tomorrowCount} appointment${tomorrowCount > 1 ? "s" : ""} scheduled for tomorrow.`,
      `Reminder: ${tomorrowCount} appointment${tomorrowCount > 1 ? "s" : ""} happening tomorrow.`,
      `Prepare ahead — ${tomorrowCount} appointment${tomorrowCount > 1 ? "s" : ""} set for tomorrow.`,
      `Tomorrow’s schedule has ${tomorrowCount} appointment${tomorrowCount > 1 ? "s" : ""}.`,
      `Upcoming notice: ${tomorrowCount} appointment${tomorrowCount > 1 ? "s" : ""} tomorrow.`,
    ];

    const randomTodayMessage =
      todayCount > 0
        ? todayMessages[Math.floor(Math.random() * todayMessages.length)]
        : null;
    const randomTomorrowMessage =
      tomorrowCount > 0
        ? tomorrowMessages[Math.floor(Math.random() * tomorrowMessages.length)]
        : null;

    /* =======================================================
       🔹 4️⃣ Notify all admins (avoid duplicates for the same day)
    ======================================================= */
    if (todayCount > 0 || tomorrowCount > 0) {
      const [admins] = await pool.query(
        "SELECT id FROM users WHERE role='admin'"
      );

      for (const admin of admins) {
        // Prevent duplicate notification for today
        if (todayCount > 0 && randomTodayMessage) {
          const [existsToday] = await pool.query(
            `SELECT id FROM notifications
             WHERE user_id=? AND title=? 
             AND DATE(created_at)=CURDATE()`,
            [admin.id, "Today's Appointments"]
          );

          if (existsToday.length === 0) {
            await createNotification({
              user_id: admin.id,
              title: "Today's Appointments",
              message: randomTodayMessage,
              type: "appointment",
            });
          }
        }

        // Prevent duplicate notification for tomorrow
        if (tomorrowCount > 0 && randomTomorrowMessage) {
          const [existsTomorrow] = await pool.query(
            `SELECT id FROM notifications
             WHERE user_id=? AND title=? 
             AND DATE(created_at)=CURDATE()`,
            [admin.id, "Upcoming Appointments"]
          );

          if (existsTomorrow.length === 0) {
            await createNotification({
              user_id: admin.id,
              title: "Upcoming Appointments",
              message: randomTomorrowMessage,
              type: "appointment",
            });
          }
        }
      }

      console.log(`🔔 Admin notifications checked — no duplicates created`);
    }

    /* =======================================================
       🔹 5️⃣ Pagination + status filter support
    ======================================================= */
    const status = req.query.status || "all"; // ✅ added
    const whereStatus =
      status && status !== "all" ? `WHERE a.status = ?` : "";
    const statusParam =
      status && status !== "all" ? [status] : [];

    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const offset = (page - 1) * pageSize;

    const sortBy = req.query.sortBy || "id";
    const sortDir = (req.query.sortDir || "DESC").toUpperCase();
    const SORTABLE = new Set(["id", "name", "date", "status"]);
    const safeKey = SORTABLE.has(sortBy) ? `a.${sortBy}` : "a.id";
    const safeDir = sortDir === "ASC" ? "ASC" : "DESC";

    /* =======================================================
       🔹 6️⃣ Count + rows query (with filter)
    ======================================================= */
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments a ${whereStatus}`,
      statusParam
    );
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [rows] = await pool.query(
      `SELECT 
         a.id, a.service_id,
         a.name, a.email, a.contactNumber, a.address,
         s.name AS serviceName,
         a.status,
         DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
         a.time, a.notes
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       ${whereStatus}
       ORDER BY ${safeKey} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...statusParam, pageSize, offset]
    );

    const [serviceRows] = await pool.query(
      `SELECT id, name FROM services WHERE active = TRUE ORDER BY name ASC`
    );

    /* =======================================================
       🔹 7️⃣ Response
    ======================================================= */
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


/* ==================================================
   GET /api/admin/appointments/conflicts
   → Quick conflict preview (for admin timepicker modal)
================================================== */
export const getAppointmentConflicts = async (req, res) => {
  try {
    const { service_id, date, time } = req.query;
    if (!service_id || !date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required query params" });
    }

    const [rows] = await pool.query(
      `SELECT id, name, time, status
       FROM appointments
       WHERE service_id = ? AND date = ?
         AND status IN ('pending','approved')
         AND ABS(TIME_TO_SEC(TIMEDIFF(time, ?))) < 3600
       ORDER BY time ASC`,
      [service_id, date, time]
    );

    return res.json({ success: true, conflicts: rows });
  } catch (err) {
    console.error("❌ getAppointmentConflicts error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch conflicts" });
  }
};

/* ==================================================
   POST /api/admin/appointments/filter
================================================== */
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
   GET /api/admin/appointments/today
   → Returns today's appointments for admin dashboard
================================================== */
export const getTodayAppointments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         a.id, 
         a.name, 
         a.contactNumber,
         a.email,
         a.date,
         a.time,
         a.status,
         s.name AS serviceName
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE DATE(a.date) = CURDATE()
       ORDER BY a.time ASC`
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("❌ getTodayAppointments error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's appointments",
    });
  }
};

/* ==================================================
   GET /api/admin/appointments/export
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
