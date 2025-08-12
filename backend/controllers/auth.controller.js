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
export const signup = handleAsyncError(async (req, res) => {
  const { email, password, name } = req.body;

  const v = validateSignup({ name, email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  let connection;

  try {
    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );
    if (existingUsers.length > 0) {
      throw new AppError("User already  exists", 400);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Generate verification token (6-digit code) valid for 24h
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // Create user (unverified)
    const [result] = await connection.execute(
      `INSERT INTO users (email, password, name, verificationToken, verificationTokenExpiresAt, isVerified)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [
        normalizedEmail,
        hashedPassword,
        name.trim(),
        verificationToken,
        verificationTokenExpiresAt,
      ]
    );

    // Send verification email (non-fatal)
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
      console.log(`📧 Verification email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // You may decide to keep or delete the user if email fails — current choice: keep and allow re-send
    }

    return sendResponse(
      res,
      201,
      true,
      "User created. Please check your email for the verification code.",
      {
        user: {
          id: result.insertId,
          email: normalizedEmail,
          name: name.trim(),
          isVerified: false,
        },
      }
    );
  } finally {
    if (connection) connection.release();
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

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      `SELECT * FROM users
       WHERE verificationToken = ? AND verificationTokenExpiresAt > NOW()`,
      [code.trim()]
    );

    if (users.length === 0) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const user = users[0];

    // Update user as verified & clear verification fields
    await connection.execute(
      `UPDATE users
       SET isVerified = TRUE, verificationToken = NULL, verificationTokenExpiresAt = NULL
       WHERE id = ?`,
      [user.id]
    );

    // Send welcome email (non-fatal)
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log(`🎉 Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    // ✅ Issue tokens now that email is verified
    generateTokenAndSetCookie(res, user.id);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: true,
    };

    return sendResponse(res, 200, true, "Email verified successfully", {
      user: userData,
    });
  } finally {
    if (connection) connection.release();
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
    if (!rt) {
      throw new AppError("Unauthorized - No refresh token", 401);
    }

    // Verify refresh token
    const decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [decoded.userId]
    );
    if (users.length === 0)
      throw new AppError("Unauthorized - User not found", 401);

    const user = users[0];
    // must be verified
    if (!user.isVerified) throw new AppError("Email not verified", 403);

    // rotate cookies
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenAndSetCookie(res, decoded.userId);

    const userPayload = {
      ...user,
    };

    return sendResponse(res, 200, true, "Tokens refreshed", {
      user: userPayload,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Clear invalid tokens/cookies
    clearAuthCookies(res);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
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
  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    // If no user, still return 200 to avoid enumeration
    if (users.length === 0) {
      return sendResponse(
        res,
        200,
        true,
        "Password reset link sent to your email"
      );
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await connection.execute(
      "UPDATE users SET resetPasswordToken = ?, resetPasswordExpiresAt = ? WHERE id = ?",
      [resetToken, resetTokenExpiresAt, user.id]
    );

    // Send password reset email
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(normalizedEmail, resetURL);
      console.log(`🔐 Password reset email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("Password reset email failed:", emailError.message);
      throw new AppError("Failed to send reset email", 500);
    }

    return sendResponse(
      res,
      200,
      true,
      "Password reset link sent to your email"
    );
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /auth/reset-password/:token
 */
export const resetPassword = handleAsyncError(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const v = validateResetPassword({ token, password });
  if (!v.ok) throw new AppError(v.message, 400);

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpiresAt > NOW()",
      [token.trim()]
    );

    if (users.length === 0) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const user = users[0];

    const hashedPassword = await bcryptjs.hash(password, 12);

    await connection.execute(
      "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpiresAt = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    // Non-fatal success email
    try {
      await sendPasswordResetSuccessEmail(user.email);
      console.log(`✅ Password reset success email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("Reset success email failed:", emailError.message);
    }

    return sendResponse(res, 200, true, "Password reset successful");
  } finally {
    if (connection) connection.release();
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

  let connection;
  try {
    connection = await pool.getConnection();

    // cannot be same as current email
    const [me] = await connection.execute(
      "SELECT id, email FROM users WHERE id = ?",
      [req.userId]
    );
    if (me.length === 0) throw new AppError("User not found", 404);
    if (me[0].email.toLowerCase() === email) {
      throw new AppError("New email must be different from current email", 400);
    }

    // must not be used by another account
    const [dup] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (dup.length > 0) throw new AppError("Email is already in use", 400);

    // create 6-digit code valid for 15 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute(
      `UPDATE users
       SET pendingEmail = ?, pendingEmailCode = ?, pendingEmailExpiresAt = ?
       WHERE id = ?`,
      [email, code, expires, req.userId]
    );

    try {
      await sendChangeEmailCode(email, code);
    } catch (e) {
      console.error("sendChangeEmailCode failed:", e.message);
      // keep record; allow retry
    }

    return sendResponse(res, 200, true, "Verification code sent");
  } finally {
    if (connection) connection.release();
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

  let connection;
  try {
    connection = await pool.getConnection();

    // Load pending request
    const [rows] = await connection.execute(
      `SELECT * FROM users
       WHERE id = ? AND pendingEmail = ? AND pendingEmailCode = ? AND pendingEmailExpiresAt > NOW()`,
      [req.userId, email, code]
    );

    if (rows.length === 0) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const user = rows[0];
    const oldEmail = user.email;

    // Ensure email still not taken (race condition)
    const [dup] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.userId]
    );
    if (dup.length > 0) throw new AppError("Email is already in use", 400);

    // Apply change & clear pending fields
    await connection.execute(
      `UPDATE users
       SET email = ?, pendingEmail = NULL, pendingEmailCode = NULL, pendingEmailExpiresAt = NULL
       WHERE id = ?`,
      [email, req.userId]
    );

    try {
      await sendEmailChangedNotice(oldEmail, email);
    } catch (e) {
      console.error("sendEmailChangedNotice failed:", e.message);
    }

    const [updated] = await connection.execute(
      "SELECT id, email, name, role, isVerified, lastLogin, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [req.userId]
    );
    return sendResponse(res, 200, true, "Email updated", { user: updated[0] });
  } finally {
    if (connection) connection.release();
  }
});
