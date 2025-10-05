import pool from "../../config/db.js";

/* ==================================================
   VALIDATION
================================================== */
function validateAdvisory(data) {
  const errors = {};
  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.message?.trim()) errors.message = "Message is required";
  if (!data.type) errors.type = "Type is required (announcement/reminder)";
  return errors;
}

/* ==================================================
   CREATE
================================================== */
export async function createAdvisory(req, res) {
  try {
    const { title, message, type, status = "active" } = req.body;
    const errors = validateAdvisory(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    const [result] = await pool.query(
      `INSERT INTO advisories (title, message, type, status) VALUES (?, ?, ?, ?)`,
      [title, message, type, status]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ CREATE ADVISORY ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   READ ALL
================================================== */
export async function getAllAdvisories(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM advisories ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ GET ADVISORIES ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   UPDATE (EDIT)
================================================== */
export async function updateAdvisory(req, res) {
  try {
    const { id } = req.params;
    const { title, message, type, status } = req.body;

    const errors = validateAdvisory(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    await pool.query(
      `UPDATE advisories SET title=?, message=?, type=?, status=? WHERE id=?`,
      [title, message, type, status, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE ADVISORY ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   TOGGLE STATUS (Prevent all inactive)
================================================== */
export async function toggleAdvisoryStatus(req, res) {
  try {
    const { id } = req.params;

    // Check the current advisory
    const [rows] = await pool.query(
      "SELECT status FROM advisories WHERE id=?",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });

    const [activeRows] = await pool.query(
      "SELECT COUNT(*) as activeCount FROM advisories WHERE status='active'"
    );

    const newStatus = rows[0].status === "active" ? "inactive" : "active";

    // ❌ Prevent disabling the last active advisory
    if (rows[0].status === "active" && activeRows[0].activeCount <= 1) {
      return res.status(400).json({
        success: false,
        error: "At least one advisory must remain active.",
      });
    }

    await pool.query("UPDATE advisories SET status=? WHERE id=?", [
      newStatus,
      id,
    ]);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("❌ TOGGLE ADVISORY STATUS ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   DELETE (Prevent removing all)
================================================== */
export async function deleteAdvisory(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT id FROM advisories WHERE id=?", [
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ success: false, error: "Not found" });

    const [count] = await pool.query(
      "SELECT COUNT(*) AS total FROM advisories"
    );
    if (count[0].total <= 1) {
      return res.status(400).json({
        success: false,
        error: "At least one advisory must remain in the system.",
      });
    }

    await pool.query("DELETE FROM advisories WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE ADVISORY ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
