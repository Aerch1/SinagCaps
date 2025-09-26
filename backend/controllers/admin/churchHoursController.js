import pool from "../../config/db.js";

/* ---------------- GET /api/admin/church-hours ---------------- */
export const getChurchHours = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM church_hours ORDER BY day_of_week ASC"
    );
    res.json({ success: true, hours: rows });
  } catch (err) {
    console.error("❌ getChurchHours", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



/* ---------------- RESET to default ---------------- */
export const resetChurchHours = async (req, res) => {
  try {
    const defaults = [
      [0, "08:00:00", "18:00:00", false],
      [1, "08:00:00", "18:00:00", false],
      [2, "08:00:00", "18:00:00", false],
      [3, "08:00:00", "18:00:00", false],
      [4, "08:00:00", "18:00:00", false],
      [5, "08:00:00", "18:00:00", false],
      [6, "08:00:00", "18:00:00", false],
    ];

    await pool.query("DELETE FROM church_hours"); // reset table
    for (const [day, open, close, is_closed] of defaults) {
      await pool.query(
        "INSERT INTO church_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?)",
        [day, open, close, is_closed]
      );
    }

    res.json({ success: true, message: "Church hours reset to default" });
  } catch (err) {
    console.error("❌ resetChurchHours", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------------- Update single day ---------------- */
export const updateChurchHour = async (req, res) => {
  try {
    const { day } = req.params;
    const { open_time, close_time, is_closed } = req.body;

    await pool.query(
      "UPDATE church_hours SET open_time=?, close_time=?, is_closed=? WHERE day_of_week=?",
      [open_time || "00:00:00", close_time || "00:00:00", !!is_closed, day]
    );

    res.json({ success: true, message: "Church hours updated" });
  } catch (err) {
    console.error("❌ updateChurchHour", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
