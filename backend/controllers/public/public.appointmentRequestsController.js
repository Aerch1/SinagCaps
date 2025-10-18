import pool from "../../config/db.js";
import { format } from "date-fns";

// ------------------------
// Public: Request Reschedule
// ------------------------
// ------------------------
// Public: Request Reschedule
// ------------------------
export async function requestReschedule(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { requested_date, requested_time, notes } = req.body;

    if (!requested_date || !requested_time || !notes?.trim())
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be modified.",
      });

    // Prevent reschedule to the same date/time
    if (appt.date === requested_date && appt.time === requested_time) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot reschedule to the same date/time as your current appointment.",
      });
    }

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND type='reschedule' AND status='pending'`,
      [id]
    );
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You already have a pending reschedule request.",
      });

    // Validate datetime
    const dt = new Date(`${requested_date}T${requested_time}`);
    if (isNaN(dt.getTime()))
      return res
        .status(400)
        .json({ success: false, message: "Invalid requested date/time." });

    const now = new Date();
    if (dt <= now)
      return res
        .status(400)
        .json({ success: false, message: "You cannot select a past date/time." });

    // Validate working hours (8:00 AM - 5:00 PM)
    const [hour, minute] = requested_time.split(":").map(Number);
    if (hour < 8 || hour > 17 || (hour === 17 && minute > 0)) {
      return res.status(400).json({
        success: false,
        message: "Requested time must be within working hours (8:00 AM - 5:00 PM).",
      });
    }

    await conn.execute(
      `INSERT INTO appointment_requests (appointment_id, type, requested_date, requested_time, notes) VALUES (?, 'reschedule', ?, ?, ?)`,
      [id, requested_date, requested_time, notes]
    );

    return res.json({
      success: true,
      message: "Reschedule request submitted successfully.",
    });
  } catch (err) {
    console.error("requestReschedule error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}


// ------------------------
// Public: Request Cancel
// ------------------------
export async function requestCancel(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { notes } = req.body;

    if (!notes?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Reason is required." });

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be cancelled.",
      });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND type='cancel' AND status='pending'`,
      [id]
    );
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You already have a pending cancellation request.",
      });

    await conn.execute(
      `INSERT INTO appointment_requests (appointment_id, type, notes) VALUES (?, 'cancel', ?)`,
      [id, notes]
    );

    return res.json({
      success: true,
      message: "Cancellation request submitted successfully.",
    });
  } catch (err) {
    console.error("requestCancel error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ------------------------
// Admin: Get All User Requests with Client Name
// ------------------------
export async function getAllUserRequests(req, res) {
  const conn = await pool.getConnection();
  try {
    console.log(
      "Fetching all user requests from appointment_requests table..."
    );

    const [requests] = await conn.execute(
      `SELECT 
         ar.id AS request_id,
         ar.appointment_id,
         ar.type,
         ar.requested_date,
         ar.requested_time,
         ar.notes,
         ar.status AS request_status,
         ar.created_at,
         ar.updated_at,
         a.name AS client_name
       FROM appointment_requests ar
       LEFT JOIN appointments a ON ar.appointment_id = a.id
       ORDER BY ar.created_at DESC`
    );

    const mapped = requests.map((r) => {
      let requestedDateTime = "-";

      if (r.type === "reschedule" && r.requested_date && r.requested_time) {
        const date = new Date(r.requested_date);
        const [hours, minutes, seconds] = r.requested_time
          .split(":")
          .map(Number);

        if (!isNaN(date.getTime()) && ![hours, minutes, seconds].some(isNaN)) {
          date.setHours(hours, minutes, seconds, 0);
          requestedDateTime = format(date, "MM/dd/yyyy, h:mm a"); // e.g., 10/17/2025, 11:11 AM
        } else {
          console.warn(
            `Invalid date/time for request ${r.request_id}:`,
            r.requested_date,
            r.requested_time
          );
        }
      }

      return {
        id: r.request_id,
        appointmentId: r.appointment_id,
        clientName: r.client_name || "-", // <-- new field
        type: r.type,
        requestedDateTime,
        notes: r.notes || "-",
        request_status: r.request_status || "pending",
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

    console.log("Mapped requests for API response:", mapped);
    return res.json({ success: true, requests: mapped });
  } catch (err) {
    console.error("getAllUserRequests error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ------------------------
// Admin: Approve Request
// ------------------------
export async function approveRequest(req, res) {
  const conn = await pool.getConnection();
  try {
    const { requestId } = req.params;

    // Fetch pending request
    const [[request]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE id=? AND status='pending'`,
      [requestId]
    );

    if (!request)
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed.",
      });

    await conn.beginTransaction();

    if (request.type === "reschedule") {
      // Update main appointment with requested date/time
      if (request.requested_date && request.requested_time) {
        await conn.execute(
          `UPDATE appointments SET date=?, time=?, was_rescheduled=1 WHERE id=?`,
          [
            request.requested_date,
            request.requested_time,
            request.appointment_id,
          ]
        );
      }
    } else if (request.type === "cancel") {
      // Approve cancellation: mark appointment as cancelled
      await conn.execute(
        `UPDATE appointments SET status='cancelled', cancelled_at=NOW() WHERE id=?`,
        [request.appointment_id]
      );
    }

    // Mark request as approved
    await conn.execute(
      `UPDATE appointment_requests SET status='approved' WHERE id=?`,
      [requestId]
    );

    await conn.commit();
    return res.json({
      success: true,
      message: "Request approved successfully.",
    });
  } catch (err) {
    await conn.rollback();
    console.error("approveRequest error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

// ------------------------
// Admin: Deny Request
// ------------------------
export async function denyRequest(req, res) {
  const conn = await pool.getConnection();
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    if (!notes?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Reason is required." });

    // Fetch pending request
    const [[request]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE id=? AND status='pending'`,
      [requestId]
    );

    if (!request)
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed.",
      });

    // Only update request status and notes, keep appointment as-is
    await conn.execute(
      `UPDATE appointment_requests SET status='rejected', notes=? WHERE id=?`,
      [notes, requestId]
    );

    return res.json({ success: true, message: "Request denied successfully." });
  } catch (err) {
    console.error("denyRequest error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}
