// src/controllers/admin/admin.announcements.controller.js
import pool from "../../config/db.js";

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
   CREATE
================================================== */
export async function createAnnouncement(req, res) {
  try {
    const { title, category, text, date, status = "active" } = req.body;
    const errors = validateAnnouncement(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    // ✅ Author from logged-in user
    const [userRows] = await pool.query("SELECT name FROM users WHERE id=?", [
      req.userId,
    ]);
    const author = userRows[0]?.name || "Admin User";

    const [result] = await pool.query(
      `
      INSERT INTO announcements (title, category, author, text, date, status)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [title, category, author, text, date, status]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ CREATE ANNOUNCEMENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
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
