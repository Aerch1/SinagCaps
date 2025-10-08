import pool from "../config/db.js";

export async function createNotification({
  user_id = null,
  title,
  message,
  type = "system",
  reference_id = null,
}) {
  try {
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, title, message, type, reference_id]
    );
  } catch (err) {
    console.error("❌ Failed to create notification:", err.message);
  }
}
