import pool from "../../config/db.js";

/* =========================================================
   📥 Get all notifications for admin
========================================================= */
export async function getAdminNotifications(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
          id,
          user_id AS userId,
          title,
          message,
          type,
          reference_id AS referenceId,
          is_read AS isRead,
          created_at AS createdAt
       FROM notifications
       WHERE (user_id IS NULL OR user_id = ?)
         AND type IN ('appointment', 'schedule', 'event', 'message')
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("❌ Error in getAdminNotifications:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load admin notifications." });
  }
}

/* =========================================================
   🟢 Mark admin notification as read
========================================================= */
export async function markAdminNotificationRead(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });

    res.json({ success: true, message: "Admin notification marked as read." });
  } catch (err) {
    console.error("❌ Error in markAdminNotificationRead:", err);
    res.status(500).json({
      success: false,
      error: "Failed to mark admin notification as read.",
    });
  }
}

/* =========================================================
   🗑️ Delete admin notification
========================================================= */
export async function deleteAdminNotification(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM notifications WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });

    res.json({ success: true, message: "Admin notification deleted." });
  } catch (err) {
    console.error("❌ Error in deleteAdminNotification:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete admin notification.",
    });
  }
}
