import pool from "../../config/db.js";

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
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be modified.",
        });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND type='reschedule' AND status='pending'`,
      [id]
    );
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: "You already have a pending reschedule request.",
        });

    // Validate datetime properly
    const dt = new Date(`${requested_date}T${requested_time}`);
    if (isNaN(dt.getTime()) || dt <= new Date())
      return res
        .status(400)
        .json({ success: false, message: "Invalid requested date/time." });

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
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be cancelled.",
        });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE appointment_id=? AND type='cancel' AND status='pending'`,
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
// Admin: Get All User Requests
// ------------------------
export async function getAllUserRequests(req, res) {
  const conn = await pool.getConnection();
  try {
    const [requests] = await conn.execute(
      `SELECT 
         ar.id AS request_id,
         ar.appointment_id,
         ar.type,
         ar.requested_date,
         ar.requested_time,
         ar.notes,
         ar.status AS request_status,
         a.date AS current_date,
         a.time AS current_time,
         a.name AS client_name,
         a.email AS client_email,
         a.status AS appointment_status
       FROM appointment_requests ar
       LEFT JOIN appointments a ON ar.appointment_id = a.id
       ORDER BY ar.created_at DESC`
    );

    const mapped = requests.map((r) => ({
      id: r.request_id,
      appointmentId: r.appointment_id,
      type: r.type,
      requestedDateTime:
        r.type === "reschedule" && r.requested_date && r.requested_time
          ? new Date(`${r.requested_date}T${r.requested_time}`).toISOString()
          : null,
      notes: r.notes || "-",
      request_status: r.request_status || "pending",
      appointment: {
        date: r.current_date || null,
        time: r.current_time || null,
        clientName: r.client_name || "—",
        clientEmail: r.client_email || "—",
        status: r.appointment_status || "unknown",
      },
    }));

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

    await conn.beginTransaction();

    if (request.type === "reschedule") {
      // Update main appointment table with requested date/time
      await conn.execute(
        `UPDATE appointments SET date=?, time=?, was_rescheduled=1 WHERE id=?`,
        [request.requested_date, request.requested_time, request.appointment_id]
      );
    } else if (request.type === "cancel") {
      await conn.execute(
        `UPDATE appointments SET status='cancelled' WHERE id=?`,
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
