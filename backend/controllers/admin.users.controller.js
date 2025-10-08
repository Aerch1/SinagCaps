// src/controllers/admin.users.controller.js
import pool from "../config/db.js";
import {
  handleAsyncError,
  sendResponse,
  AppError,
} from "../utils/errorHandler.js";

/* ============================================================
   GET ALL USERS (Super Admin)
============================================================ */
export const getAllUsers = handleAsyncError(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, isVerified, lastLogin, created_at 
     FROM users 
     ORDER BY created_at DESC`
  );
  return sendResponse(res, 200, true, "All users fetched", { users: rows });
});

/* ============================================================
   UPDATE USER STATUS (Activate / Deactivate)
============================================================ */
export const updateUserStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Only accept these values
  const validStatuses = ["activated", "deactivated"];
  if (!validStatuses.includes(status.toLowerCase())) {
    throw new AppError("Invalid action", 400);
  }

  // Determine new role or disable flag
  const isDeactivated = status.toLowerCase() === "deactivated";
  await pool.execute(
    "UPDATE users SET isVerified = ?, updated_at = NOW() WHERE id = ?",
    [isDeactivated ? 0 : 1, id]
  );

  const label = isDeactivated ? "deactivated" : "activated";
  return sendResponse(res, 200, true, `User ${label} successfully`);
});

/* ============================================================
   DELETE USER
============================================================ */
export const deleteUser = handleAsyncError(async (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself or super admin
  if (Number(req.userId) === Number(id)) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const [rows] = await pool.execute("SELECT role FROM users WHERE id = ?", [
    id,
  ]);
  if (!rows.length) throw new AppError("User not found", 404);

  const role = rows[0].role;
  if (role === "admin") {
    throw new AppError("Cannot delete another admin account", 403);
  }

  await pool.execute("DELETE FROM users WHERE id = ?", [id]);
  return sendResponse(res, 200, true, "User deleted successfully");
});
export const createUserAccount = handleAsyncError(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!email || !password || !role) {
    throw new AppError("Email, password, and role are required", 400);
  }

  if (!["user", "admin"].includes(role)) {
    throw new AppError("Invalid role type", 400);
  }

  // Default name if not provided
  const displayName = name && name.trim() ? name.trim() : "New Account";

  // Check if email already exists
  const [existing] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length) {
    throw new AppError("Email already exists", 400);
  }

  // Hash password
  const bcryptjs = await import("bcryptjs");
  const hashed = await bcryptjs.default.hash(password, 12);

  await pool.execute(
    "INSERT INTO users (name, email, password, role, isVerified) VALUES (?, ?, ?, ?, ?)",
    [displayName, email, hashed, role, true]
  );

  return sendResponse(res, 201, true, `${role === "admin" ? "Admin" : "User"} account created successfully`);
});