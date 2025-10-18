import pool from "../../config/db.js";
import {
  normalizeTime,
  normalizeDateForMySQL,
} from "../../utils/validateAppointment.js";
import {
  formatReadableDate,
  formatReadableTime,
} from "../../utils/dateUtils.js";
import {
  sendAppointmentRescheduledEmail,
  sendAppointmentCancelledEmail,
} from "../../utils/appointmentEmails.js";
import { createNotification } from "../../utils/createNotification.js";

/* =========================
   Public: Request Reschedule
========================= */
export async function requestReschedule(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { requested_date, requested_time, notes } = req.body;

    if (!requested_date || !requested_time || !notes?.trim())
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be modified",
        });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND status='pending' AND type='reschedule'`,
      [id]
    );
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: "You already have a pending reschedule request.",
        });

    const requestedDateTime = new Date(`${requested_date}T${requested_time}`);
    if (requestedDateTime <= new Date())
      return res
        .status(400)
        .json({
          success: false,
          message: "Requested date and time must be in the future.",
        });

    await conn.execute(
      `INSERT INTO appointment_requests (appointment_id, type, requested_date, requested_time, notes) VALUES (?, 'reschedule', ?, ?, ?)`,
      [id, requested_date, requested_time, notes]
    );

    return res.json({
      success: true,
      message: "Reschedule request submitted successfully",
    });
  } catch (err) {
    console.error("requestReschedule error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

/* =========================
   Public: Request Cancel
========================= */
export async function requestCancel(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { notes } = req.body;

    if (!notes?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Reason is required" });

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be cancelled",
        });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND status='pending' AND type='cancel'`,
      [id]
    );
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: "You already have a pending cancellation request.",
        });

    await conn.execute(
      `INSERT INTO appointment_requests (appointment_id, type, notes) VALUES (?, 'cancel', ?)`,
      [id, notes]
    );

    return res.json({
      success: true,
      message: "Cancellation request submitted successfully",
    });
  } catch (err) {
    console.error("requestCancel error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

/* =========================
   Admin: Approve Request
========================= */
export async function approveRequest(req, res) {
  const conn = await pool.getConnection();
  try {
    const { requestId } = req.params;

    const [[request]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE id=? AND status='pending'`,
      [requestId]
    );
    if (!request)
      return res.status(404).json({ success: false, message: "Request not found or already processed." });

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=?`,
      [request.appointment_id]
    );
    if (!appt)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    if (request.type === "reschedule") {
      const safeDate = normalizeDateForMySQL(request.requested_date);
      const safeTime = normalizeTime(request.requested_time);

      // Directly update appointment in DB
      await conn.execute(
        `UPDATE appointments SET date=?, time=?, was_rescheduled=1 WHERE id=?`,
        [safeDate, safeTime, appt.id]
      );

      if (appt.email)
        await sendAppointmentRescheduledEmail(appt.email, {
          name: appt.name,
          serviceName: appt.service_name || "Selected Service",
          oldDate: formatReadableDate(appt.date),
          oldTime: formatReadableTime(appt.time),
          newDate: formatReadableDate(safeDate),
          newTime: formatReadableTime(safeTime),
        });

      if (appt.user_id)
        await createNotification({
          user_id: appt.user_id,
          title: "Appointment Rescheduled",
          message: `${appt.name}'s appointment was rescheduled to ${formatReadableDate(safeDate)} at ${formatReadableTime(safeTime)}.`,
          type: "appointment",
          reference_id: appt.id,
          transaction_id: `APT-${String(appt.id).padStart(5, "0")}`,
        });
    }

    if (request.type === "cancel") {
      // Directly update appointment in DB
      await conn.execute(`UPDATE appointments SET status='cancelled' WHERE id=?`, [appt.id]);

      if (appt.email)
        await sendAppointmentCancelledEmail(appt.email, {
          status: "cancelled",
          name: appt.name,
          serviceName: appt.service_name || "Selected Service",
          date: formatReadableDate(appt.date),
          time: formatReadableTime(appt.time),
          reason: request.notes || "Cancelled by admin",
        });

      if (appt.user_id)
        await createNotification({
          user_id: appt.user_id,
          title: "Appointment Cancelled",
          message: `${appt.name}'s appointment was cancelled.`,
          type: "appointment",
          reference_id: appt.id,
          transaction_id: `APT-${String(appt.id).padStart(5, "0")}`,
        });
    }

    // Mark request as approved
    await conn.execute(`UPDATE appointment_requests SET status='approved' WHERE id=?`, [requestId]);

    return res.json({ success: true, message: "Request approved successfully" });
  } catch (err) {
    console.error("approveRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}


/* =========================
   Admin: Reject Request
========================= */
export async function rejectRequest(req, res) {
  const conn = await pool.getConnection();
  try {
    const { requestId } = req.params;

    const [[request]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE id=? AND status='pending'`,
      [requestId]
    );
    if (!request)
      return res
        .status(404)
        .json({
          success: false,
          message: "Request not found or already processed.",
        });

    await conn.execute(
      `UPDATE appointment_requests SET status='rejected' WHERE id=?`,
      [requestId]
    );

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=?`,
      [request.appointment_id]
    );
    if (appt && appt.user_id) {
      await createNotification({
        user_id: appt.user_id,
        title: "Appointment Request Rejected",
        message: `Your ${request.type} request for ${appt.date} at ${appt.time} was rejected.`,
        type: "appointment",
        reference_id: appt.id,
        transaction_id: `APT-${String(appt.id).padStart(5, "0")}`,
      });
    }

    return res.json({ success: true, message: "Request rejected" });
  } catch (err) {
    console.error("rejectRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}
