import pool from "../../config/db.js";

/* =========================
   Request Reschedule
========================= */
export async function requestReschedule(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { requested_date, requested_time, notes } = req.body;

    if (!requested_date || !requested_time || !notes?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments 
       WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be modified",
      });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests 
       WHERE appointment_id=? AND status='pending' AND type='reschedule'`,
      [id]
    );
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You already have a pending reschedule request.",
      });

    const requestedDateTime = new Date(`${requested_date}T${requested_time}`);
    if (requestedDateTime <= new Date())
      return res.status(400).json({
        success: false,
        message: "Requested date and time must be in the future.",
      });

    await conn.beginTransaction();
    await conn.execute(
      `INSERT INTO appointment_requests 
       (appointment_id, type, requested_date, requested_time, notes) 
       VALUES (?, 'reschedule', ?, ?, ?)`,
      [id, requested_date, requested_time, notes]
    );
    await conn.commit();

    return res.json({
      success: true,
      message: "Reschedule request submitted successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("requestReschedule error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

/* =========================
   Request Cancel
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
      `SELECT * FROM appointments 
       WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt)
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be cancelled",
      });

    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests 
       WHERE appointment_id=? AND status='pending' AND type='cancel'`,
      [id]
    );
    if (existing)
      return res.status(400).json({
        success: false,
        message: "You already have a pending cancellation request.",
      });

    await conn.execute(
      `INSERT INTO appointment_requests 
       (appointment_id, type, notes) 
       VALUES (?, 'cancel', ?)`,
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
   Get User Requests
========================= */
export async function getUserRequests(req, res) {
  const userId = req.user?.id;
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
          ar.created_at AS request_created_at,
          a.name AS appointment_name,
          a.date AS appointment_date,
          a.time AS appointment_time,
          a.status AS appointment_status,
          a.was_rescheduled
       FROM appointment_requests ar
       JOIN appointments a ON ar.appointment_id = a.id
       WHERE a.user_id = ?
       ORDER BY ar.created_at DESC`,
      [userId]
    );

    // Map to frontend-friendly structure
    const mapped = requests.map((r) => {
      let requestedDateTime = "-";
      if (r.type === "reschedule") {
        // Use requested date/time for reschedule requests
        requestedDateTime = `${r.requested_date || "-"} ${
          r.requested_time || ""
        }`;
      } else if (r.type === "cancel") {
        // Use original appointment date/time for cancel requests
        requestedDateTime = `${r.appointment_date || "-"} ${
          r.appointment_time || ""
        }`;
      }

      return {
        id: r.request_id,
        appointmentId: r.appointment_id,
        name: r.appointment_name || "—",
        requestedDateTime,
        notes: r.notes || "—",
        request_status: r.request_status || "pending",
        type: r.type, // reschedule or cancel
      };
    });

    return res.json({ success: true, requests: mapped });
  } catch (err) {
    console.error("getUserRequests error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

/* =========================
   Approve Request
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
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed.",
      });

    await conn.beginTransaction();

    if (request.type === "reschedule") {
      await conn.execute(
        `UPDATE appointments SET date=?, time=?, was_rescheduled=1 WHERE id=?`,
        [request.requested_date, request.requested_time, request.appointment_id]
      );
    }

    if (request.type === "cancel") {
      await conn.execute(
        `UPDATE appointments SET status='cancelled' WHERE id=?`,
        [request.appointment_id]
      );
    }

    await conn.execute(
      `UPDATE appointment_requests SET status='approved' WHERE id=?`,
      [requestId]
    );

    await conn.commit();
    return res.json({
      success: true,
      message: "Request approved successfully",
    });
  } catch (err) {
    await conn.rollback();
    console.error("approveRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

/* =========================
   Deny Request
========================= */
export async function denyRequest(req, res) {
  const conn = await pool.getConnection();
  try {
    const { requestId } = req.params;

    const [[request]] = await conn.execute(
      `SELECT * FROM appointment_requests WHERE id=? AND status='pending'`,
      [requestId]
    );
    if (!request)
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed.",
      });

    await conn.execute(
      `UPDATE appointment_requests SET status='denied' WHERE id=?`,
      [requestId]
    );

    return res.json({ success: true, message: "Request denied" });
  } catch (err) {
    console.error("denyRequest error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}
