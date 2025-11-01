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
  hasActiveBookingSameService,
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
import {
  formatReadableDate,
  formatReadableTime,
} from "../../utils/dateUtils.js"; // 🆕 for formatting

/* =======================================================
   Constants
======================================================= */
const STATUSES = [
  "pending",
  "approved",
  "completed",
  "cancelled",
  "rejected",
  "archived",
];

/* =======================================================
   Small Utilities
======================================================= */
function normalizeDateForMySQL(date) {
  if (!date) return null;
  if (typeof date === "string" && date.includes("T")) return date.split("T")[0];
  return date;
}

function runAsyncPostCommit(fn) {
  process.nextTick(async () => {
    try {
      await fn();
    } catch (err) {
      console.error("⚠️ post-commit task failed:", err?.message || err);
    }
  });
}

function normalizeSort(sortByRaw, sortDirRaw, prefix = "a.") {
  const SORTABLE = new Set(["id", "name", "date", "status"]);
  const key = SORTABLE.has(String(sortByRaw))
    ? `${prefix}${sortByRaw}`
    : `${prefix}id`;
  const dir =
    String(sortDirRaw || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { key, dir };
}

/* =======================================================
   POST /api/admin/appointments
======================================================= */
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
      `SELECT id FROM appointments
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
      });
    }

    // 🔹 Duplicate check
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

    // 🔹 Prevent duplicate active booking for same email + same service
    if (await hasActiveBookingSameService({ email, service_id })) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        code: "SAME_SERVICE_BOOKING",
        message:
          "This person already has an active appointment for the same service.",
      });
    }

    // 🔹 Slot availability
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

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointmentId: newId,
    });

    // ✉️ Post-commit: email only (no admin notifications)
    runAsyncPostCommit(async () => {
      const [[service]] = await pool.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      const serviceName = service?.name || "Selected Service";

      await sendAppointmentCreatedEmail(email, {
        name,
        serviceName,
        date,
        time: t,
        appointmentId: newId,
      }).catch((e) =>
        console.error("sendAppointmentCreatedEmail failed:", e.message)
      );
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


/* =======================================================
   PATCH /api/admin/appointments/:id
   ✅ Note: Updating children is complex - consider adding 
   separate endpoint if needed. For now, this handles 
   basic appointment updates only.
======================================================= */
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

    // ✅ Require reason for cancel or reject
    if ((status === "cancelled" || status === "rejected") && !notes?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for cancellation or rejection.",
      });
    }

    await conn.beginTransaction();

    // 🔹 Fetch old appointment
    const [[oldAppt]] = await conn.query(
      `SELECT id, user_id, service_id, date, time, status, name, email, contactNumber, address, was_rescheduled
       FROM appointments WHERE id = ?`,
      [id]
    );

    if (!oldAppt) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const sid = service_id || oldAppt.service_id;
    const safeDate = date ? normalizeDateForMySQL(date) : oldAppt.date;
    const safeTime = time ? normalizeTime(time) : oldAppt.time;

    // ✅ Normalize both status values
    const oldStatus = String(oldAppt.status).toLowerCase();
    const newStatus = status ? String(status).toLowerCase() : oldStatus;

    // ✅ Rescheduling check
    const isRescheduling =
      (date || time) &&
      (oldAppt.date !== safeDate || oldAppt.time !== safeTime) &&
      !["cancelled", "rejected"].includes(newStatus);

    if (isRescheduling && oldStatus !== "approved") {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "You can only reschedule appointments that are already approved.",
      });
    }

    // 🧭 Conflict validation
    if (isRescheduling) {
      const [conflicts] = await conn.query(
        `SELECT id FROM appointments
         WHERE service_id = ?
           AND date = ?
           AND status IN ('pending', 'approved')
           AND id != ?
           AND ABS(TIME_TO_SEC(TIMEDIFF(time, ?))) < 3600`,
        [sid, safeDate, id, safeTime]
      );

      if (conflicts.length && !override) {
        await conn.rollback();
        return res.status(409).json({
          success: false,
          code: "TIME_CONFLICT",
          confirmNeeded: true,
          message: `There's another appointment near ${safeTime}. Proceed anyway?`,
        });
      }
    }

    // 📝 Update appointment
    await applyUpdate({
      id,
      status: newStatus,
      date: safeDate,
      time: safeTime,
      notes: notes?.trim() || null,
      name: name || oldAppt.name,
      email: email || oldAppt.email,
      contactNumber: contactNumber || oldAppt.contactNumber,
      address: address || oldAppt.address,
      service_id: sid,
      was_rescheduled: isRescheduling ? true : oldAppt.was_rescheduled,
    });

    await conn.commit();

    res.json({
      success: true,
      message: `Appointment ${newStatus} successfully`,
      was_rescheduled: isRescheduling,
    });

    // 📩 Post-commit emails & notifications
    runAsyncPostCommit(async () => {
      const [[service]] = await pool.query(
        "SELECT name FROM services WHERE id = ?",
        [sid]
      );
      const serviceName = service?.name || "Selected Service";
      const finalName = name || oldAppt.name;
      const targetEmail = email || oldAppt.email;
      if (!targetEmail) return;

      // ✅ Format date & time
      const formattedOldDate = formatReadableDate(oldAppt.date);
      const formattedNewDate = formatReadableDate(safeDate);
      const formattedOldTime = formatReadableTime(oldAppt.time);
      const formattedNewTime = formatReadableTime(safeTime);

      // 📧 Email logic
      if (isRescheduling) {
        await sendAppointmentRescheduledEmail(targetEmail, {
          name: finalName,
          serviceName,
          oldDate: formattedOldDate,
          oldTime: formattedOldTime,
          newDate: formattedNewDate,
          newTime: formattedNewTime,
        });
      } else if (newStatus === "cancelled" || newStatus === "rejected") {
        await sendAppointmentCancelledEmail(targetEmail, {
          status: newStatus,
          name: finalName,
          serviceName,
          date: formattedNewDate || formattedOldDate,
          time: formattedNewTime || formattedOldTime,
          reason:
            notes?.trim() ||
            (newStatus === "cancelled"
              ? "Appointment was cancelled by the parish office."
              : "Appointment was rejected by the parish office."),
        });
      } else {
        await sendAppointmentUpdatedEmail(targetEmail, {
          name: finalName,
          serviceName,
          date: formattedNewDate,
          time: formattedNewTime,
          status: newStatus,
          appointmentId: id,
        });
      }

      // 🛎️ Notifications
      let title, message;
      if (isRescheduling) {
        title = "Appointment Rescheduled";
        message = `${finalName}'s ${serviceName} appointment was rescheduled to ${formattedNewDate} at ${formattedNewTime}.`;
      } else if (newStatus === "approved") {
        title = "Appointment Approved";
        message = `${finalName}'s ${serviceName} appointment was approved for ${formattedNewDate} at ${formattedNewTime}.`;
      } else if (newStatus === "rejected") {
        title = "Appointment Rejected";
        message = `${finalName}'s ${serviceName} appointment was rejected.`;
      } else if (newStatus === "cancelled") {
        title = "Appointment Cancelled";
        message = `${finalName}'s ${serviceName} appointment was cancelled.`;
      }

      // 🛎️ Notifications - only for the public user
      if (title && oldAppt.user_id) {
        const [[user]] = await pool.query(
          `SELECT role FROM users WHERE id = ?`,
          [oldAppt.user_id]
        );

        if (user?.role !== "admin") {
          await createNotification({
            user_id: oldAppt.user_id,
            title,
            message,
            type: "appointment",
            reference_id: id,
            transaction_id: `APT-${String(id).padStart(5, "0")}`,
          });
        }
      }
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ updateAppointmentAdmin error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: err.message,
    });
  } finally {
    if (conn) conn.release();
  }
};
/* =======================================================
   GET /api/admin/appointments/:id
   ✅ UPDATED: Fetch multiple children for baptism
   ✅ Ensure was_rescheduled returned to frontend
   ✅ Added documents fetching
======================================================= */
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
         a.was_rescheduled,
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

    if (!appt)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    let details = null;
    let sponsors = [];
    let children = []; // ✅ NEW: Array for multiple children

    if (appt.form_type === "baptism") {
      // ✅ Fetch baptism_details (parent info only)
      [[details]] = await pool.execute(
        `SELECT 
           id,
           fatherName,
           motherMaidenName,
           parentsMarriageType
         FROM baptism_details 
         WHERE appointment_id=?`,
        [id]
      );

      if (details) {
        const baptismId = details.id;

        // ✅ NEW: Fetch all children for this baptism
        const [childrenRows] = await pool.execute(
          `SELECT 
             id,
             childFullName,
             childDob,
             childBirthplace,
             child_order
           FROM baptism_children 
           WHERE baptism_id=?
           ORDER BY child_order ASC`,
          [baptismId]
        );
        children = childrenRows;

        // ✅ Fetch sponsors (shared across all children)
        const [sponsorRows] = await pool.execute(
          `SELECT role, name, address
           FROM baptism_sponsors 
           WHERE baptism_id=?`,
          [baptismId]
        );
        sponsors = sponsorRows;

        // ✅ Remove baptism_id from response (internal use only)
        delete details.id;
      }
    }

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

    // ✅ Fetch uploaded documents
    const [documents] = await pool.execute(
      `SELECT id, url 
       FROM appointment_documents 
       WHERE appointment_id = ? 
       ORDER BY id ASC`,
      [id]
    );

    // ✅ Build response with children array for baptism
    const response = {
      success: true,
      appointment: appt,
      details,
      sponsors,
      documents,
    };

    // ✅ Add children array only for baptism
    if (appt.form_type === "baptism") {
      response.children = children;
    }

    return res.json(response);
  } catch (err) {
    console.error("❌ getAppointmentById error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch appointment" });
  }
};

/* =======================================================
   GET /api/admin/appointments
   - auto-complete old approved
   - fetch counts (today/tomorrow)
   - paginate list
======================================================= */
export const getAppointments = async (req, res) => {
  try {
    // 1️⃣ Auto-mark old approved as completed (3 days past)
    await pool.query(`
      UPDATE appointments
      SET status = 'completed'
      WHERE status = 'approved'
        AND TIMESTAMP(date, time) < NOW() - INTERVAL 3 DAY
    `);

    // 2️⃣ Fetch approved appointments for notifications (unchanged)
    const [todayAppointments] = await pool.query(`
      SELECT id, name
      FROM appointments
      WHERE DATE(date) = CURDATE() 
        AND status = 'approved'
      ORDER BY time ASC
    `);

    const [tomorrowAppointments] = await pool.query(`
      SELECT id, name
      FROM appointments
      WHERE DATE(date) = CURDATE() + INTERVAL 1 DAY 
        AND status = 'approved'
      ORDER BY time ASC
    `);

    const todayCount = todayAppointments.length;
    const tomorrowCount = tomorrowAppointments.length;

    // 3️⃣ Admin notifications (unchanged)
    const adminTodayMessage =
      todayCount > 0
        ? `Today's Appointments:\n${todayAppointments
            .map((appt) => `ID: ${appt.id}, Name: ${appt.name}`)
            .join("\n")}`
        : null;

    const adminTomorrowMessage =
      tomorrowCount > 0
        ? `Upcoming Appointments:\n${tomorrowAppointments
            .map((appt) => `ID: ${appt.id}, Name: ${appt.name}`)
            .join("\n")}`
        : null;

    if (todayCount > 0 || tomorrowCount > 0) {
      const [admins] = await pool.query(
        "SELECT id FROM users WHERE role='admin'"
      );

      await Promise.allSettled(
        admins.map(async (admin) => {
          if (adminTodayMessage) {
            const [existsToday] = await pool.query(
              `SELECT id FROM notifications
               WHERE user_id=? AND title=? AND DATE(created_at)=CURDATE()`,
              [admin.id, "Today's Appointments"]
            );
            if (existsToday.length === 0) {
              await createNotification({
                user_id: admin.id,
                title: "Today's Appointments",
                message: adminTodayMessage,
                type: "appointment",
              });
            }
          }

          if (adminTomorrowMessage) {
            const [existsTomorrow] = await pool.query(
              `SELECT id FROM notifications
               WHERE user_id=? AND title=? AND DATE(created_at)=CURDATE()`,
              [admin.id, "Upcoming Appointments"]
            );
            if (existsTomorrow.length === 0) {
              await createNotification({
                user_id: admin.id,
                title: "Upcoming Appointments",
                message: adminTomorrowMessage,
                type: "appointment",
              });
            }
          }
        })
      );
    }

    // 4️⃣ Pagination + listing
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const offset = (page - 1) * pageSize;

    const { key: safeKey, dir: safeDir } = normalizeSort(
      req.query.sortBy,
      req.query.sortDir
    );

    // ✅ 4.1 Handle optional status filter
    const { status } = req.query;
    let whereClause = "";
    let params = [];

    if (status) {
      const allowed = status.split(",").map((s) => s.trim());
      whereClause = `WHERE a.status IN (${allowed.map(() => "?").join(",")})`;
      params = allowed;
    }

    // ✅ 4.2 Count total (unchanged — still counts all)
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments`
    );
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // ✅ 4.3 Main fetch query (with optional WHERE)
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
       ${whereClause}
       ORDER BY ${safeKey} ${safeDir}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // ✅ 4.4 Service list (unchanged)
    const [serviceRows] = await pool.query(
      `SELECT id, name FROM services WHERE active = TRUE ORDER BY name ASC`
    );

    // ✅ 4.5 Response
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

/* =======================================================
   GET /api/admin/appointments/conflicts
======================================================= */
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

/* =======================================================
   GET /api/admin/appointments/today
======================================================= */
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
         AND a.status = 'approved'
       ORDER BY a.time ASC`
    );

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error("❌ getTodayAppointments error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's appointments",
    });
  }
};

/* =======================================================
   POST /api/admin/appointments/filter
======================================================= */
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
    const { key: safeKey, dir: safeDir } = normalizeSort(sortBy, sortDir, "");

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
      ORDER BY ${safeKey || "a.id"} ${safeDir}
      LIMIT ? OFFSET ?`;

    const [[{ total }]] = await pool.query(sqlCount, values);
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
