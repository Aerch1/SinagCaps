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

    // Verify ownership and ensure appointment is not completed or cancelled
    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments 
       WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be modified",
        });
    }

    // Prevent duplicate pending reschedule request
    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests 
       WHERE appointment_id=? AND status='pending' AND type='reschedule'`,
      [id]
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending reschedule request.",
      });
    }

    // Check that requested date/time is in the future
    const requestedDateTime = new Date(`${requested_date}T${requested_time}`);
    if (requestedDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Requested date and time must be in the future.",
      });
    }

    // Insert request in a transaction
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

    if (!notes?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Reason is required" });
    }

    // Verify ownership and ensure appointment is not completed or cancelled
    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments 
       WHERE id=? AND user_id=? AND status NOT IN ('completed','cancelled')`,
      [id, userId]
    );
    if (!appt) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found or cannot be cancelled",
        });
    }

    // Prevent duplicate pending cancel request
    const [[existing]] = await conn.execute(
      `SELECT * FROM appointment_requests 
       WHERE appointment_id=? AND status='pending' AND type='cancel'`,
      [id]
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending cancellation request.",
      });
    }

    // Insert cancel request
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
