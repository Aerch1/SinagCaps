// middleware/isAdmin.js
import pool from "../config/db.js";

export const isAdmin = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT role FROM users WHERE id = ?`, [
      req.userId,
    ]);

    if (!rows.length || rows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - admin access only",
      });
    }

    next();
  } catch (err) {
    console.error("isAdmin middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
