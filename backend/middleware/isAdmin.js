// src/middleware/isAdmin.js
import pool from "../config/db.js";

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const [rows] = await pool.execute(
      "SELECT role FROM users WHERE id = ? LIMIT 1",
      [req.userId]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (rows[0].role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: admin only" });
    }
    next();
  } catch (e) {
    next(e);
  }
};
