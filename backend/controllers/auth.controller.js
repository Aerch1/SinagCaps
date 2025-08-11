import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
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
 */
export const signup = handleAsyncError(async (req, res) => {
  const { email, password, name } = req.body;

  // Shared validation (single source of truth)
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
      throw new AppError("User already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Generate verification token (6-digit code)
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ); // 24 hours

    // Create user
    const [result] = await connection.execute(
      "INSERT INTO users (email, password, name, verificationToken, verificationTokenExpiresAt) VALUES (?, ?, ?, ?, ?)",
      [
        normalizedEmail,
        hashedPassword,
        name.trim(),
        verificationToken,
        verificationTokenExpiresAt,
      ]
    );

    // Get the created user
    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified FROM users WHERE id = ?",
      [result.insertId]
    );
    const user = users[0];

    // Generate tokens and set cookies
    generateTokenAndSetCookie(res, user.id);

    // Send verification email (non-fatal if it fails)
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
      console.log(`📧 Verification email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    return sendResponse(
      res,
      201,
      true,
      "User created successfully. Please check your email for verification code.",
      { user }
    );
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /auth/verify-email
 */
export const verifyEmail = handleAsyncError(async (req, res) => {
  const { code } = req.body;

  // Shared validation
  const v = validateVerifyEmail({ code });
  if (!v.ok) throw new AppError(v.message, 400);

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE verificationToken = ? AND verificationTokenExpiresAt > NOW()",
      [code.trim()]
    );

    if (users.length === 0) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const user = users[0];

    // Update user as verified
    await connection.execute(
      "UPDATE users SET isVerified = TRUE, verificationToken = NULL, verificationTokenExpiresAt = NULL WHERE id = ?",
      [user.id]
    );

    // Send welcome email (non-fatal if it fails)
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log(`🎉 Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

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
 */
export const login = handleAsyncError(async (req, res) => {
  const { email, password } = req.body;

  // Shared validation
  const v = validateLogin({ email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  let connection;

  try {
    connection = await pool.getConnection();

    // Find user by email
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      throw new AppError("Account not registered", 404);
    }

    const user = users[0];

    // Optional: Require email verification
    if (!user.isVerified) {
      throw new AppError("Please verify your email before logging in", 403);
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Incorrect password", 401);
    }

    // Update last login timestamp
    await connection.execute(
      "UPDATE users SET lastLogin = NOW() WHERE id = ?",
      [user.id]
    );

    // Generate tokens and set cookies
    generateTokenAndSetCookie(res, user.id);

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
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
 */
export const logout = handleAsyncError(async (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sendResponse(res, 200, true, "Logged out successfully");
});

/**
 * POST /auth/refresh-token
 */
export const refreshToken = handleAsyncError(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  let connection;

  try {
    if (!refreshToken) {
      throw new AppError("Unauthorized - No refresh token", 401);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      throw new AppError("Unauthorized - User not found", 401);
    }

    const user = users[0];

    // Generate new tokens (rotate refresh token)
    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenAndSetCookie(res, decoded.userId);

    return sendResponse(res, 200, true, "Tokens refreshed", {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Clear invalid tokens
    res.clearCookie("token");
    res.clearCookie("refreshToken");

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
 * Privacy-friendly: respond 200 regardless of account existence.
 */
export const forgotPassword = handleAsyncError(async (req, res) => {
  const { email } = req.body;

  // Shared validation
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
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

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

  // Shared validation
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

    // Hash new password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Update password and clear reset token
    await connection.execute(
      "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpiresAt = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    // Send reset success email (non-fatal if it fails)
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
 */
export const checkAuth = handleAsyncError(async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT id, email, name, role, isVerified, lastLogin FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      throw new AppError("User not found", 404);
    }

    const user = users[0];

    return sendResponse(res, 200, true, "User authenticated", { user });
  } finally {
    if (connection) connection.release();
  }
});
