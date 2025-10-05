import pool from "../../config/db.js";
import { v2 as cloudinary } from "cloudinary";

/* ==================================================
   VALIDATION HELPER
================================================== */
function validateEvent(data) {
  const errors = {};
  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.date) errors.date = "Date is required";
  if (!data.time) errors.time = "Time is required";
  if (!data.type) errors.type = "Type (event/news) is required";
  return errors;
}

/* ==================================================
   CREATE
================================================== */
export async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      date,
      time,
      status = "Active",
      type,
    } = req.body;

    const errors = validateEvent(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    // ✅ Cloudinary auto returns .path = secure URL
    const image_url = req.file?.path || null;

    const [result] = await pool.query(
      `
        INSERT INTO events (title, description, date, time, status, type, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [title, description, date, time, status, type, image_url]
    );

    res.json({ success: true, id: result.insertId, image_url });
  } catch (err) {
    console.error("❌ CREATE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   READ ALL
================================================== */
export async function getAllEvents(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY date DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ GET EVENTS ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   UPDATE
================================================== */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const { title, description, date, time, status, type } = req.body;

    const errors = validateEvent(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    // ✅ If a new image was uploaded, use Cloudinary URL
    const image_url = req.file?.path || null;

    await pool.query(
      `
        UPDATE events
        SET title=?, description=?, date=?, time=?, status=?, type=?, image_url=COALESCE(?, image_url)
        WHERE id=?
      `,
      [title, description, date, time, status, type, image_url, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   DELETE
================================================== */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT image_url FROM events WHERE id=?", [
      id,
    ]);

    // ✅ Safely delete from Cloudinary
    if (rows[0]?.image_url) {
      const url = rows[0].image_url;
      const parts = url.split("/");
      const folder = parts.at(-2); // e.g., olopgv_events
      const filename = parts.at(-1).split(".")[0]; // remove .jpg
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    await pool.query("DELETE FROM events WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
