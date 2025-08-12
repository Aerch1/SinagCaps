// src/controllers/profile.controller.js
import pool from "../config/db.js";
import {
  handleAsyncError,
  AppError,
  sendResponse,
} from "../utils/errorHandler.js";
import { validateProfile } from "../../shared/validation.js";

export const updateProfile = handleAsyncError(async (req, res) => {
  const { name, phone, gender, dob, location } = req.body;

  const v = validateProfile({ name, phone, gender, dob, location });
  if (!v.ok) throw new AppError(v.message, 400);

  let connection;
  try {
    connection = await pool.getConnection();

    await connection.execute(
      `UPDATE users
         SET name = ?, phone = ?, gender = ?, dob = ?, location = ?
       WHERE id = ?`,
      [
        name.trim(),
        phone.trim(),
        gender.trim(),
        dob.trim(),
        location.trim(),
        req.userId,
      ]
    );

    const [rows] = await connection.execute(
      `SELECT
     id, email, name, role, isVerified, lastLogin,
     phone, gender, dob,
     location, avatarUrl
   FROM users
   WHERE id = ?`,
      [req.userId]
    );

    if (rows.length === 0) throw new AppError("User not found", 404);

    return sendResponse(res, 200, true, "Profile updated", { user: rows[0] });
  } finally {
    if (connection) connection.release();
  }
});
