import bcryptjs from "bcryptjs";
import crypto from "crypto";
import pool from "../../config/db.js";
import {
  AppError,
  handleAsyncError,
  sendResponse,
} from "../../utils/errorHandler.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../../utils/emailService.js";
import { generateTokenAndSetCookie } from "../../utils/generateTokenAndSetCookie.js";

/* ==================================================
   GET /api/admin/security/profile
   → Fetch admin profile
   (protected by verifyToken + isAdmin)
================================================== */
export const getAdminProfile = handleAsyncError(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? AND role = 'admin'",
      [req.userId]
    );

    if (!rows.length) throw new AppError("Admin not found", 404);

    return sendResponse(res, 200, true, "Admin profile fetched successfully", {
      user: rows[0],
    });
  } finally {
    conn.release();
  }
});

/* ==================================================
   PATCH /api/admin/security/profile
   → Update admin name & email
   (protected by verifyToken + isAdmin)
================================================== */
export const updateAdminProfile = handleAsyncError(async (req, res) => {
  const { name, email } = req.body;

  if (!name?.trim()) throw new AppError("Name is required", 400);
  if (!email?.trim()) throw new AppError("Email is required", 400);

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT * FROM users WHERE id = ? AND role = 'admin'",
      [req.userId]
    );
    if (!rows.length) throw new AppError("Admin not found", 404);

    const admin = rows[0];

    const [dup] = await conn.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email.trim().toLowerCase(), admin.id]
    );
    if (dup.length) throw new AppError("Email is already in use", 400);

    await conn.execute(
      "UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name.trim(), email.trim().toLowerCase(), admin.id]
    );

    const [updated] = await conn.execute(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?",
      [admin.id]
    );

    return sendResponse(res, 200, true, "Profile updated successfully", {
      user: updated[0],
    });
  } finally {
    conn.release();
  }
});

/* ==================================================
   PATCH /api/admin/security/change-password
   → Change admin password
   (protected by verifyToken + isAdmin)
================================================== */
export const changeAdminPassword = handleAsyncError(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) throw new AppError("Current password required", 400);
  if (!newPassword || newPassword.length < 6)
    throw new AppError("New password must be at least 6 characters", 400);

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT * FROM users WHERE id = ? AND role = 'admin'",
      [req.userId]
    );
    if (!rows.length) throw new AppError("Admin not found", 404);

    const admin = rows[0];

    const match = await bcryptjs.compare(currentPassword, admin.password);
    if (!match) throw new AppError("Incorrect current password", 401);

    const same = await bcryptjs.compare(newPassword, admin.password);
    if (same)
      throw new AppError(
        "New password cannot be the same as the current password",
        400
      );

    const hashed = await bcryptjs.hash(newPassword, 12);
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      admin.id,
    ]);

    try {
      await sendPasswordResetSuccessEmail(admin.email);
    } catch (e) {
      console.warn("⚠️ Password change notice failed:", e.message);
    }

    generateTokenAndSetCookie(res, admin.id);

    return sendResponse(res, 200, true, "Password updated successfully");
  } finally {
    conn.release();
  }
});

/* ==================================================
   POST /api/admin/security/forgot-password
   → Send reset link via email
================================================== */
export const forgotAdminPassword = handleAsyncError(async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) throw new AppError("Email is required", 400);

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      "SELECT id, email, role FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    if (!rows.length) throw new AppError("Account not found", 404);
    const user = rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Store in password_resets table
    await conn.execute(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, token, expires]
    );

    // Determine reset URL (admin vs public)
    const baseURL = process.env.FRONTEND_URL || "http://localhost:5174";
    const resetPath =
      user.role === "admin"
        ? `/admin/reset-password/${token}`
        : `/reset-password/${token}`;
    const resetURL = `${baseURL}${resetPath}`;

    console.log("🔗 Reset link:", resetURL);

    // Send reset email
    await sendPasswordResetEmail(user.email, resetURL);

    return sendResponse(
      res,
      200,
      true,
      "Password reset link sent to your email address"
    );
  } finally {
    conn.release();
  }
});

/* ==================================================
   POST /api/admin/security/reset-password/:token
   → Reset password using token
================================================== */
export const resetAdminPassword = handleAsyncError(async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || newPassword.length < 6)
    throw new AppError("Password must be at least 6 characters", 400);
  if (newPassword !== confirmPassword)
    throw new AppError("Passwords do not match", 400);

  const conn = await pool.getConnection();
  try {
    // Validate token
    const [rows] = await conn.execute(
      `SELECT pr.user_id, u.email 
       FROM password_resets pr 
       JOIN users u ON pr.user_id = u.id 
       WHERE pr.token = ? 
         AND pr.expires_at > NOW() 
         AND pr.consumed_at IS NULL`,
      [token]
    );

    if (!rows.length) throw new AppError("Invalid or expired reset link", 400);
    const { user_id, email } = rows[0];

    // Hash and update password
    const hashed = await bcryptjs.hash(newPassword, 12);
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user_id,
    ]);

    // Mark token as consumed
    await conn.execute(
      "UPDATE password_resets SET consumed_at = NOW() WHERE token = ?",
      [token]
    );

    // Send confirmation email
    try {
      await sendPasswordResetSuccessEmail(email);
    } catch (e) {
      console.warn("⚠️ Password reset success email failed:", e.message);
    }

    return sendResponse(res, 200, true, "Password reset successfully");
  } finally {
    conn.release();
  }
});
