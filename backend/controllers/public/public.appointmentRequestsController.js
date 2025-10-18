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

    // Verify ownership
    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=?`,
      [id, userId]
    );
    if (!appt)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    // Prevent duplicate pending reschedule request
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

    // Insert request
    await conn.execute(
      `INSERT INTO appointment_requests 
       (appointment_id, type, requested_date, requested_time, notes) 
       VALUES (?, 'reschedule', ?, ?, ?)`,
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

    // Verify ownership
    const [[appt]] = await conn.execute(
      `SELECT * FROM appointments WHERE id=? AND user_id=?`,
      [id, userId]
    );
    if (!appt)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    // Prevent duplicate pending cancel request
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

    // Insert request
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
