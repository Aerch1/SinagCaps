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
  AppError,
  handleAsyncError,
  sendResponse,
} from "../utils/errorHandler.js";

export const signup = handleAsyncError(async (req, res) => {
  const { email, password, name } = req.body;
  let connection;

  try {
    // Validation
    if (!email || !password || !name) {
      throw new AppError("All fields are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
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
        email,
        hashedPassword,
        name,
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

    // Send verification email (don't fail signup if email fails)
    try {
      await sendVerificationEmail(email, verificationToken);
      console.log(`📧 Verification email sent to: ${email}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // Continue with signup even if email fails
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

export const verifyEmail = handleAsyncError(async (req, res) => {
  const { code } = req.body;
  let connection;

  try {
    if (!code) {
      throw new AppError("Verification code is required", 400);
    }

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE verificationToken = ? AND verificationTokenExpiresAt > NOW()",
      [code]
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

    // Send welcome email (don't fail verification if email fails)
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

export const login = handleAsyncError(async (req, res) => {
  const { email, password } = req.body;
  let connection;

  try {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    connection = await pool.getConnection();

    // Find user by email
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      throw new AppError("Invalid credentials", 401);
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Update last login
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

export const logout = handleAsyncError(async (req, res) => {
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

    // Generate new tokens (with new refresh token for rotation)
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

export const forgotPassword = handleAsyncError(async (req, res) => {
  const { email } = req.body;
  let connection;

  try {
    if (!email) {
      throw new AppError("Email is required", 400);
    }

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      throw new AppError("User not found", 404);
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
      await sendPasswordResetEmail(email, resetURL);
      console.log(`🔐 Password reset email sent to: ${email}`);
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

export const resetPassword = handleAsyncError(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  let connection;

  try {
    if (!password) {
      throw new AppError("Password is required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    connection = await pool.getConnection();

    const [users] = await connection.execute(
      "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpiresAt > NOW()",
      [token]
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

    // Send reset success email (don't fail if email fails)
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
