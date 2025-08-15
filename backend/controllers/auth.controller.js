// controllers/auth.controller.js
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  generateTokenAndSetCookie,
  clearAuthCookies,
} from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendChangeEmailCode, // NEW
  sendEmailChangedNotice, // NEW
} from "../utils/emailService.js";
import {
  validateSignup,
  validateVerifyEmail,
  validateResetPassword,
  validateLogin,
  validateForgotPassword,
} from "../../shared/validation.js";

import {
  AppError,
  handleAsyncError,
  sendResponse,
} from "../utils/errorHandler.js";

/**
 * POST /auth/signup
 * - Creates unverified user
 * - Sends verification email
 * - ❌ Does NOT issue tokens or set cookies here
 */
// controllers/auth.controller.js (only the changed functions shown)
export const signup = handleAsyncError(async (req, res) => {
  const { email, password, name } = req.body;
  const v = validateSignup({ name, email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  let conn;

  try {
    conn = await pool.getConnection();

    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );
    if (existing.length) throw new AppError("User already  exists", 400);

    const hashed = await bcryptjs.hash(password, 12);
    const [r] = await conn.execute(
      "INSERT INTO users (email, password, name, isVerified) VALUES (?, ?, ?, FALSE)",
      [normalizedEmail, hashed, name.trim()]
    );

    // create 6-digit code (24h)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await conn.execute(
      `INSERT INTO email_verification_tokens
       (user_id, token, purpose, sent_to_email, expires_at)
       VALUES (?, ?, 'signup', ?, ?)`,
      [r.insertId, code, normalizedEmail, expires]
    );

    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (e) {
      console.error("sendVerificationEmail failed:", e.message);
    }

    return sendResponse(
      res,
      201,
      true,
      "User created. Please check your email for the verification code.",
      {
        user: {
          id: r.insertId,
          email: normalizedEmail,
          name: name.trim(),
          isVerified: false,
        },
      }
    );
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /auth/verify-email
 * - Validates 6-digit code
 * - Marks user verified
 * - ✅ Issues tokens and sets cookies here
 */
export const verifyEmail = handleAsyncError(async (req, res) => {
  const { code } = req.body;
  const v = validateVerifyEmail({ code });
  if (!v.ok) throw new AppError(v.message, 400);

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      `SELECT evt.*, u.email, u.name, u.role
       FROM email_verification_tokens evt
       JOIN users u ON u.id = evt.user_id
       WHERE evt.token = ? AND evt.purpose = 'signup'
         AND evt.consumed_at IS NULL
         AND evt.expires_at > NOW()
       ORDER BY evt.created_at DESC
       LIMIT 1`,
      [code.trim()]
    );

    if (!rows.length)
      throw new AppError("Invalid or expired verification code", 400);
    const evt = rows[0];

    await conn.execute("UPDATE users SET isVerified = TRUE WHERE id = ?", [
      evt.user_id,
    ]);
    await conn.execute(
      "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = ?",
      [evt.id]
    );

    try {
      await sendWelcomeEmail(evt.email, evt.name);
    } catch (e) {
      console.error("Welcome email failed:", e.message);
    }

    generateTokenAndSetCookie(res, evt.user_id);

    return sendResponse(res, 200, true, "Email verified successfully", {
      user: {
        id: evt.user_id,
        email: evt.email,
        name: evt.name,
        role: evt.role,
        isVerified: true,
      },
    });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /auth/login
 * - Requires verified user
 * - ✅ Issues tokens and sets cookies
 */
export const login = handleAsyncError(async (req, res) => {
  const { email, password } = req.body;

  const v = validateLogin({ email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      throw new AppError("Account not registered", 404);
    }

    const user = users[0];

    if (!user.isVerified) {
      throw new AppError("Please verify your email before logging in", 403);
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Incorrect password", 401);
    }

    await connection.execute(
      "UPDATE users SET lastLogin = NOW() WHERE id = ?",
      [user.id]
    );

    // ✅ Issue tokens on successful login
    generateTokenAndSetCookie(res, user.id);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: true,
      phone: user.phone ?? null,
      gender: user.gender ?? null,
      dob: user.dob ?? null, // ← no formatting
      location: user.location ?? null,
      avatarUrl: user.avatarUrl ?? null,
    };

    return sendResponse(res, 200, true, "Logged in successfully", {
      user: userData,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /auth/logout
 * - Clears cookies
 */
export const logout = handleAsyncError(async (_req, res) => {
  clearAuthCookies(res);
  return sendResponse(res, 200, true, "Logged out successfully");
});

/**
 * POST /auth/refresh-token
 * - Requires refresh cookie
 * - Requires verified user
 * - Rotates both access + refresh cookies
 */
export const refreshToken = handleAsyncError(async (req, res) => {
  const rt = req.cookies?.refreshToken;
  let connection;

  try {
    if (!rt) throw new AppError("Unauthorized - No refresh token", 401);

    const decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [decoded.userId]
    );
    if (!users.length) throw new AppError("Unauthorized - User not found", 401);

    const user = users[0];
    if (!user.isVerified) throw new AppError("Email not verified", 403);

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenAndSetCookie(res, decoded.userId);

    return sendResponse(res, 200, true, "Tokens refreshed", {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Only clear cookies on actual JWT problems
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      clearAuthCookies(res);
      throw new AppError("Unauthorized - Invalid refresh token", 401);
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /auth/forgot-password
 * - Privacy-friendly: respond 200 regardless of account existence.
 */
export const forgotPassword = handleAsyncError(async (req, res) => {
  const { email } = req.body;
  const v = validateForgotPassword({ email });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  let conn;

  try {
    conn = await pool.getConnection();

    const [users] = await conn.execute("SELECT id FROM users WHERE email = ?", [
      normalizedEmail,
    ]);

    if (!users.length) {
      // Privacy: pretend success
      return sendResponse(
        res,
        200,
        true,
        "Password reset link sent to your email"
      );
    }

    const userId = users[0].id;
    const token = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await conn.execute(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, token, expires]
    );

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${token}`;
    try {
      await sendPasswordResetEmail(normalizedEmail, resetURL);
    } catch (e) {
      console.error("Password reset email failed:", e.message);
      throw new AppError("Failed to send reset email", 500);
    }

    return sendResponse(
      res,
      200,
      true,
      "Password reset link sent to your email"
    );
  } finally {
    if (conn) conn.release();
  }
});

/**
 * POST /auth/reset-password/:token
 */
// controllers/auth.controller.js
export const resetPassword = handleAsyncError(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // validateResetPassword call assumed above

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      `SELECT pr.*, u.email, u.password AS user_password
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ?
         AND pr.consumed_at IS NULL
         AND pr.expires_at > NOW()
       LIMIT 1`,
      [token.trim()]
    );
    if (!rows.length) throw new AppError("Invalid or expired reset token", 400);

    const pr = rows[0];

    const sameAsOld = await bcryptjs.compare(password, pr.user_password);
    if (sameAsOld) {
      // Don't consume the token; allow retry
      throw new AppError(
        "New password cannot be the same as the previous password",
        400
      );
    }

    const hashed = await bcryptjs.hash(password, 12);

    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      pr.user_id,
    ]);

    // consume this token and invalidate others
    await conn.execute(
      "UPDATE password_resets SET consumed_at = NOW() WHERE id = ?",
      [pr.id]
    );
    await conn.execute(
      "UPDATE password_resets SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL",
      [pr.user_id]
    );

    // Non-fatal email
    try {
      // sendPasswordResetSuccessEmail(pr.email)
    } catch {}

    return sendResponse(res, 200, true, "Password reset successful");
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /auth/check-auth
 * - Protected by verifyToken middleware
 */
export const checkAuth = handleAsyncError(async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified, lastLogin, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      throw new AppError("User not found", 404);
    }
    const user = users[0]; // dob unchanged
    return sendResponse(res, 200, true, "User authenticated", { user });
  } finally {
    if (connection) connection.release();
  }
});

/** ---------------------------
 *  POST /auth/reauth
 *  Requires cookie token (verifyToken in route)
 *  Body: { password }
 *  --------------------------- */
export const reauth = handleAsyncError(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError("Password is required", 400);

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) throw new AppError("User not found", 404);

    const user = rows[0];
    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) throw new AppError("Incorrect password", 401);

    return sendResponse(res, 200, true, "Password verified");
  } finally {
    if (connection) connection.release();
  }
});

export const changePassword = handleAsyncError(async (req, res) => {
  const { current, next, logoutOthers = true } = req.body;

  if (!current) throw new AppError("Current password required", 400);
  if (!next || next.length < 6)
    throw new AppError("New password must be at least 6 characters", 400);

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) throw new AppError("User not found", 404);

    const user = rows[0];

    const ok = await bcryptjs.compare(current, user.password);
    if (!ok) throw new AppError("Current password is incorrect", 401);
    const same = await bcryptjs.compare(next, user.password);
    if (same)
      throw new AppError(
        "New password cannot be the same as the current password",
        400
      );

    const hashed = await bcryptjs.hash(next, 12);
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user.id,
    ]);

    // Non-fatal notice email
    try {
      await sendPasswordResetSuccessEmail(user.email);
    } catch (e) {
      console.error("Password change notice email failed:", e.message);
    }

    // Rotate cookies so this session stays valid
    generateTokenAndSetCookie(res, user.id);

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: !!user.isVerified,
    };

    return sendResponse(res, 200, true, "Password changed successfully", {
      user: publicUser,
    });
  } finally {
    if (connection) connection.release();
  }
});

/** ----------------------------------------
 *  POST /auth/change-email/request
 *  Requires cookie token
 *  Body: { email }  -> send code to this email
 *  ---------------------------------------- */

export const deleteAccount = handleAsyncError(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError("Password is required", 400);

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) throw new AppError("User not found", 404);

    const user = rows[0];

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) throw new AppError("Incorrect password", 401);

    // If you have related tables, delete those first (FKs) or use ON DELETE CASCADE.
    await connection.execute("DELETE FROM users WHERE id = ?", [user.id]);

    // Clear cookies after deletion
    clearAuthCookies(res);

    // You could send a notice email here if you want (non-fatal)
    // try { await sendAccountDeletedNotice(user.email); } catch (e) {}

    return sendResponse(res, 200, true, "Account deleted");
  } finally {
    if (connection) connection.release();
  }
});

export const changeEmailRequest = handleAsyncError(async (req, res) => {
  let { email } = req.body;
  if (!email?.trim())
    throw new AppError("Please enter your email address", 400);
  email = email.trim().toLowerCase();

  let conn;
  try {
    conn = await pool.getConnection();

    const [me] = await conn.execute(
      "SELECT id, email FROM users WHERE id = ?",
      [req.userId]
    );
    if (!me.length) throw new AppError("User not found", 404);
    if (me[0].email.toLowerCase() === email) {
      throw new AppError("New email must be different from current email", 400);
    }

    const [dup] = await conn.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (dup.length) throw new AppError("Email is already in use", 400);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // upsert-like: try insert, else update
    await conn.execute(
      `INSERT INTO change_email_requests (user_id, new_email, code, expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), consumed_at = NULL, created_at = CURRENT_TIMESTAMP`,
      [req.userId, email, code, expires]
    );

    try {
      await sendChangeEmailCode(email, code);
    } catch (e) {
      console.error("sendChangeEmailCode failed:", e.message);
    }

    return sendResponse(res, 200, true, "Verification code sent");
  } finally {
    if (conn) conn.release();
  }
});

/** ----------------------------------------
 *  POST /auth/change-email/confirm
 *  Requires cookie token
 *  Body: { email, code }
 *  ---------------------------------------- */
export const changeEmailConfirm = handleAsyncError(async (req, res) => {
  let { email, code } = req.body;
  if (!email?.trim()) throw new AppError("Email is required", 400);
  if (!code?.trim()) throw new AppError("Verification code is required", 400);
  email = email.trim().toLowerCase();
  code = code.trim();

  let conn;
  try {
    conn = await pool.getConnection();

    // load request
    const [rows] = await conn.execute(
      `SELECT *
       FROM change_email_requests
       WHERE user_id = ? AND new_email = ? AND code = ?
         AND consumed_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [req.userId, email, code]
    );
    if (!rows.length)
      throw new AppError("Invalid or expired verification code", 400);

    const reqRow = rows[0];

    // ensure still free
    const [dup] = await conn.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.userId]
    );
    if (dup.length) throw new AppError("Email is already in use", 400);

    // apply & consume
    const [[{ email: oldEmail }]] = await conn.query(
      "SELECT email FROM users WHERE id = ? LIMIT 1",
      [req.userId]
    );
    await conn.execute("UPDATE users SET email = ? WHERE id = ?", [
      email,
      req.userId,
    ]);
    await conn.execute(
      "UPDATE change_email_requests SET consumed_at = NOW() WHERE id = ?",
      [reqRow.id]
    );

    try {
      await sendEmailChangedNotice(oldEmail, email);
    } catch (e) {
      console.error("sendEmailChangedNotice failed:", e.message);
    }

    const [updated] = await conn.execute(
      "SELECT id, email, name, role, isVerified, lastLogin, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [req.userId]
    );
    return sendResponse(res, 200, true, "Email updated", { user: updated[0] });
  } finally {
    if (conn) conn.release();
  }
});
