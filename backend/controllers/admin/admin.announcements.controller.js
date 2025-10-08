import pool from "../../config/db.js";
import { createNotification } from "../../utils/createNotification.js"; // ✅ Import helper

/* ==================================================
   VALIDATION
================================================== */
function validateAnnouncement(data) {
  const errors = {};
  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.text?.trim()) errors.text = "Content is required";
  if (!data.date) errors.date = "Date is required";
  if (!data.category?.trim()) errors.category = "Category is required";
  return errors;
}

/* ==================================================
   CREATE (neutral + concise notification with random templates)
================================================== */
export async function createAnnouncement(req, res) {
  const conn = await pool.getConnection();
  try {
    const { title, category, text, date, status = "active" } = req.body;
    const errors = validateAnnouncement(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    // ✅ Author from logged-in admin
    const [userRows] = await conn.query("SELECT name FROM users WHERE id=?", [
      req.userId,
    ]);
    const author = userRows[0]?.name || "Admin User";

    await conn.beginTransaction();

    const [result] = await conn.query(
      `
      INSERT INTO announcements (title, category, author, text, date, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [title, category, author, text, date, status]
    );

    const announcementId = result.insertId;

    /* ✅ Notify all verified public users */
    const [users] = await conn.query(
      `SELECT id FROM users WHERE role='user' AND isVerified=1`
    );

    /* ✅ Message templates — neutral, concise, varied */
    const templates = [
      `There's a new announcement: "${title}". Check it out in the Announcements section.`,
      `A new parish announcement titled "${title}" has just been posted. Visit the Announcements page for details.`,
      `Stay informed! "${title}" has been added as a new announcement. View it in the Announcements section.`,
      `📢 "${title}" has been announced. Head to the Announcements page for more information.`,
      `New announcement alert: "${title}". See what’s new in the Announcements section.`,
    ];

    for (const u of users) {
      const message = templates[Math.floor(Math.random() * templates.length)];

      await createNotification({
        user_id: u.id,
        title: "📢 New Announcement",
        message,
        type: "announcement",
        reference_id: announcementId,
      });
    }

    await conn.commit();

    res.json({ success: true, id: announcementId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ CREATE ANNOUNCEMENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  } finally {
    conn.release();
  }
}

/* ==================================================
   READ ALL
================================================== */
export async function getAllAnnouncements(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM announcements ORDER BY date DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ GET ANNOUNCEMENTS ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   READ SINGLE
================================================== */
export async function getAnnouncementById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM announcements WHERE id=?", [
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("❌ GET ANNOUNCEMENT BY ID ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   UPDATE
================================================== */
export async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { title, category, text, date, status } = req.body;

    const errors = validateAnnouncement(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    // ✅ Updated by whoever is logged in
    const [userRows] = await pool.query("SELECT name FROM users WHERE id=?", [
      req.userId,
    ]);
    const author = userRows[0]?.name || "Admin User";

    await pool.query(
      `
      UPDATE announcements
      SET title=?, category=?, author=?, text=?, date=?, status=?
      WHERE id=?
      `,
      [title, category, author, text, date, status, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE ANNOUNCEMENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   DELETE
================================================== */
export async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id FROM announcements WHERE id=?", [
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });

    await pool.query("DELETE FROM announcements WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE ANNOUNCEMENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
