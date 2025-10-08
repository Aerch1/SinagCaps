// src/controllers/profile.controller.js
import pool from "../config/db.js";
import {
  handleAsyncError,
  AppError,
  sendResponse,
} from "../utils/errorHandler.js";

/* ==================================================
   🧩 PATCH /api/profile
   → Update user profile (partial updates allowed)
================================================== */
export const updateProfile = handleAsyncError(async (req, res) => {
  const { name, phone, gender, dob, location } = req.body;

  // Build dynamic fields for partial update
  const fields = [];
  const values = [];

  if (name !== undefined) {
    fields.push("name = ?");
    values.push(name.trim());
  }
  if (phone !== undefined) {
    fields.push("phone = ?");
    values.push(phone.trim());
  }
  if (gender !== undefined) {
    fields.push("gender = ?");
    values.push(gender.trim());
  }
  if (dob !== undefined) {
    fields.push("dob = ?");
    values.push(dob.trim());
  }
  if (location !== undefined) {
    fields.push("location = ?");
    values.push(location.trim());
  }

  if (fields.length === 0) {
    throw new AppError("No fields provided for update.", 400);
  }

  let connection;
  try {
    connection = await pool.getConnection();

    await connection.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      [...values, req.userId]
    );

    const [rows] = await connection.execute(
      `SELECT id, email, name, role, isVerified, lastLogin,
              phone, gender, dob, location, avatarUrl
         FROM users
        WHERE id = ?`,
      [req.userId]
    );

    if (rows.length === 0) throw new AppError("User not found", 404);

    return sendResponse(res, 200, true, "Profile updated successfully.", {
      user: rows[0],
    });
  } finally {
    if (connection) connection.release();
  }
});
