import pool from "../../config/db.js";

/* =========================================================
   📥 Get all notifications for logged-in user
========================================================= */
export async function getMyNotifications(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
          id,
          title,
          message,
          type,
          reference_id AS referenceId,
          is_read AS isRead,
          created_at AS createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("❌ Error in getMyNotifications:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to load notifications." });
  }
}

/* =========================================================
   🟢 Mark notification as read
========================================================= */
export async function markNotificationRead(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });

    res.json({ success: true, message: "Notification marked as read." });
  } catch (err) {
    console.error("❌ Error in markNotificationRead:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to mark notification as read." });
  }
}

/* =========================================================
   🗑️ Delete notification
========================================================= */
export async function deleteNotification(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.execute(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, req.userId]
    );

    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });

    res.json({ success: true, message: "Notification deleted." });
  } catch (err) {
    console.error("❌ Error in deleteNotification:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete notification." });
  }
}
