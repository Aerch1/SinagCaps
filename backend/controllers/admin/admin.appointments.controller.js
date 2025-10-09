// src/controllers/admin/admin.appointments.controller.js
import { Parser } from "json2csv";
import pool from "../../config/db.js";
import {
  normalizeTime,
  validateCreate,
  validateUpdate, // kept import to preserve external API; not used directly here
} from "../../utils/validateAppointment.js";
import {
  getDayAvailability,
  needsConfirmationForAdmin,
  findSlot,
} from "../../services/availability.service.js";
import {
  hasDuplicateBooking,
  countBookedAt, // kept import (used elsewhere in codebase), not used here
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

/* =======================================================
   Constants
======================================================= */
// ✅ Updated statuses (removed in_progress / added archived)
const STATUSES = [
  "pending",
  "approved",
  "completed",
  "cancelled",
  "rejected",
  "archived",
];

/* =======================================================
   Small Utilities (perf + safety)
======================================================= */

// Normalize ISO string → MySQL DATE (YYYY-MM-DD)
function normalizeDateForMySQL(date) {
  if (!date) return null;
  if (typeof date === "string" && date.includes("T")) return date.split("T")[0];
  return date;
}

// Fire-and-forget after we’ve responded (non-blocking, won’t delay HTTP)
function runAsyncPostCommit(fn) {
  // Use nextTick to schedule after event loop returns, avoiding overlap
  process.nextTick(async () => {
    try {
      await fn();
    } catch (err) {
      console.error("⚠️ post-commit task failed:", err?.message || err);
    }
  });
}

// Safe sort guards
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

    // 🔹 Conflict check (within 1 hour window)
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

    // 🔹 Slot validation + Church schedule validation
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

    // Respond immediately — do not block on emails/notifications
    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointmentId: newId,
    });

    // 🔔 ✉️ Post-commit tasks (non-blocking)
    runAsyncPostCommit(async () => {
      const [[service]] = await pool.query(
        "SELECT name FROM services WHERE id=?",
        [service_id]
      );
      const serviceName = service?.name || "Selected Service";

      // Email
      await sendAppointmentCreatedEmail(email, {
        name,
        serviceName,
        date,
        time: t,
        appointmentId: newId,
      }).catch((e) =>
        console.error("sendAppointmentCreatedEmail failed:", e.message)
      );

      // Notifications (admins)
      const [admins] = await pool.query(
        "SELECT id FROM users WHERE role='admin'"
      );
      const msg = `${name} booked a ${serviceName} on ${date} at ${t}.`;
      await Promise.allSettled(
        admins.map((admin) =>
          createNotification({
            user_id: admin.id,
            title: "New Appointment Created",
            message: msg,
            type: "appointment",
            reference_id: newId,
            transaction_id: `APT-${String(newId).padStart(5, "0")}`,
          })
        )
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
   🧭 Updated: must be approved before rescheduling
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

    // 🔸 Require reason for cancel or reject
    if ((status === "cancelled" || status === "rejected") && !notes?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for cancellation or rejection.",
      });
    }

    await conn.beginTransaction();

    // 🔹 Fetch current appointment
    const [[oldAppt]] = await conn.query(
      `SELECT id, service_id, date, time, status, name, email, contactNumber, address 
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

    // 🧩 Prevent rescheduling if not approved (only when changing date/time)
    if (
      (date || time) &&
      oldAppt.status !== "approved" &&
      status !== "approved"
    ) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message:
          "You can only reschedule appointments that are already approved.",
      });
    }

    // 🔹 Conflict check (skip for cancel/reject)
    if (
      status !== "cancelled" &&
      status !== "rejected" &&
      safeDate &&
      safeTime
    ) {
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
          message: `There’s another appointment near ${safeTime}. Proceed anyway?`,
        });
      }
    }

    // 🔹 Determine new status
    const newStatus = status || oldAppt.status;

    // 🔹 Apply update
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
    });

    await conn.commit();

    res.json({
      success: true,
      message: `Appointment ${newStatus} successfully`,
    });

    // ✅ Post-commit async notifications/emails
    runAsyncPostCommit(async () => {
      const [[service]] = await pool.query(
        "SELECT name FROM services WHERE id = ?",
        [sid]
      );
      const serviceName = service?.name || "Selected Service";
      const finalName = name || oldAppt.name;
      const baseMsg = `${finalName}'s ${serviceName} appointment`;

      let title = "";
      let message = "";

      if (newStatus === "approved") {
        title = "Appointment Approved";
        message = `${baseMsg} was approved for ${safeDate} at ${safeTime}.`;
      } else if (newStatus === "cancelled") {
        title = "Appointment Cancelled";
        message = `${baseMsg} has been cancelled.`;
      } else if (newStatus === "rejected") {
        title = "Appointment Rejected";
        message = `${baseMsg} was rejected by the parish office.`;
      } else if (
        (date || time) &&
        (oldAppt.date !== safeDate || oldAppt.time !== safeTime)
      ) {
        title = "Appointment Rescheduled";
        message = `${baseMsg} was rescheduled to ${safeDate} at ${safeTime}.`;
      } else if (newStatus === "completed") {
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

      const targetEmail = email || oldAppt.email;
      if (targetEmail) {
        if (
          (date || time) &&
          (oldAppt.date !== safeDate || oldAppt.time !== safeTime) &&
          oldAppt.status === "approved"
        ) {
          await sendAppointmentRescheduledEmail(targetEmail, {
            name: finalName,
            serviceName,
            oldDate: oldAppt.date,
            oldTime: oldAppt.time,
            newDate: safeDate,
            newTime: safeTime,
          });
        } else if (newStatus === "cancelled" || newStatus === "rejected") {
          await sendAppointmentCancelledEmail(targetEmail, {
            status: newStatus,
            name: finalName,
            serviceName,
            date: safeDate || oldAppt.date,
            time: safeTime || oldAppt.time,
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
            date: safeDate,
            time: safeTime,
            status: newStatus,
            appointmentId: id,
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

    return res.json({ success: true, appointment: appt, details, sponsors });
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
    // 1) Auto-mark old approved as completed
    await pool.query(`
      UPDATE appointments
      SET status = 'completed'
      WHERE status = 'approved'
        AND TIMESTAMP(date, time) < NOW() - INTERVAL 3 DAY
    `);

    // 2) Today & tomorrow counts in ONE query
    const [counts] = await pool.query(
      `
      SELECT
        SUM(CASE WHEN DATE(date) = CURDATE() THEN 1 ELSE 0 END) AS todayCount,
        SUM(CASE WHEN DATE(date) = CURDATE() + INTERVAL 1 DAY THEN 1 ELSE 0 END) AS tomorrowCount
      FROM appointments
      WHERE status IN ('pending','approved')
    `
    );
    const todayCount = counts?.[0]?.todayCount || 0;
    const tomorrowCount = counts?.[0]?.tomorrowCount || 0;

    // 3) Optional randomized messages (kept logic)
    const todayMessages = [
      `You have ${todayCount} appointment${
        todayCount > 1 ? "s" : ""
      } scheduled for today.`,
      `${todayCount} appointment${
        todayCount > 1 ? "s" : ""
      } are lined up for today — make sure to review them.`,
      `Heads up! ${todayCount} appointment${
        todayCount > 1 ? "s" : ""
      } happening today.`,
      `Today’s schedule includes ${todayCount} appointment${
        todayCount > 1 ? "s" : ""
      }.`,
      `${todayCount} appointment${
        todayCount > 1 ? "s" : ""
      } awaiting attention today.`,
    ];

    const tomorrowMessages = [
      `You have ${tomorrowCount} appointment${
        tomorrowCount > 1 ? "s" : ""
      } scheduled for tomorrow.`,
      `Reminder: ${tomorrowCount} appointment${
        tomorrowCount > 1 ? "s" : ""
      } happening tomorrow.`,
      `Prepare ahead — ${tomorrowCount} appointment${
        tomorrowCount > 1 ? "s" : ""
      } set for tomorrow.`,
      `Tomorrow’s schedule has ${tomorrowCount} appointment${
        tomorrowCount > 1 ? "s" : ""
      }.`,
      `Upcoming notice: ${tomorrowCount} appointment${
        tomorrowCount > 1 ? "s" : ""
      } tomorrow.`,
    ];

    const randomTodayMessage =
      todayCount > 0
        ? todayMessages[Math.floor(Math.random() * todayMessages.length)]
        : null;
    const randomTomorrowMessage =
      tomorrowCount > 0
        ? tomorrowMessages[Math.floor(Math.random() * tomorrowMessages.length)]
        : null;

    // 4) Optionally notify admins (avoid duplicates per day)
    if (todayCount > 0 || tomorrowCount > 0) {
      const [admins] = await pool.query(
        "SELECT id FROM users WHERE role='admin'"
      );

      await Promise.allSettled(
        admins.map(async (admin) => {
          if (todayCount > 0 && randomTodayMessage) {
            const [existsToday] = await pool.query(
              `SELECT id FROM notifications
               WHERE user_id=? AND title=? AND DATE(created_at)=CURDATE()`,
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

          if (tomorrowCount > 0 && randomTomorrowMessage) {
            const [existsTomorrow] = await pool.query(
              `SELECT id FROM notifications
               WHERE user_id=? AND title=? AND DATE(created_at)=CURDATE()`,
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
        })
      );
    }

    // 5) Pagination + listing
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const offset = (page - 1) * pageSize;

    const { key: safeKey, dir: safeDir } = normalizeSort(
      req.query.sortBy,
      req.query.sortDir
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments`
    );
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
       ORDER BY ${safeKey} ${safeDir}
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
   GET /api/admin/appointments/export
======================================================= */
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
