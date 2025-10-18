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
  sendChangeEmailCode,
  sendEmailChangedNotice,
} from "../utils/emailService.js";
import {
  validateSignup,
  validateVerifyEmail,
  validateLogin,
  validateForgotPassword,
} from "../shared/validation.js";
import {
  AppError,
  handleAsyncError,
  sendResponse,
} from "../utils/errorHandler.js";
import { createNotification } from "../utils/createNotification.js";

/* =========================================================
   🧩 Helper Utilities
========================================================= */
const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const expireIn = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);
const withConn = async (fn) => {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
};

/* =========================================================
   🧠 AUTH CONTROLLERS
========================================================= */

// ---------- SIGNUP ----------
export const signup = handleAsyncError(async (req, res) => {
  const { email, password, name } = req.body;
  const v = validateSignup({ name, email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();

  await withConn(async (conn) => {
    const [existing] = await conn.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [normalizedEmail]
    );

    const code = randomCode();
    const expires = expireIn(24); // 24 hours

    // ✅ Existing verified user cannot signup again
    if (existing.length && existing[0].isVerified)
      throw new AppError("User already exists", 400);

    // ✅ Existing unverified user: resend verification
    if (existing.length && !existing[0].isVerified) {
      const userId = existing[0].id;
      await conn.execute(
        `INSERT INTO email_verification_tokens (user_id, token, purpose, sent_to_email, expires_at)
         VALUES (?, ?, 'signup', ?, ?)`,
        [userId, code, normalizedEmail, expires]
      );
      try {
        await sendVerificationEmail(normalizedEmail, code);
      } catch (e) {
        console.error("Resend verification email failed:", e.message);
      }

      return sendResponse(
        res,
        200,
        true,
        "Verification code resent. Please check your email.",
        {
          user: { id: userId, email: normalizedEmail, name, isVerified: false },
        }
      );
    }

    // ✅ New user: create inactive/unverified user
    const hashed = await bcryptjs.hash(password, 12);
    const [r] = await conn.execute(
      "INSERT INTO users (email, password, name, isVerified) VALUES (?, ?, ?, FALSE)",
      [normalizedEmail, hashed, name.trim()]
    );

    // Save verification token
    await conn.execute(
      `INSERT INTO email_verification_tokens (user_id, token, purpose, sent_to_email, expires_at)
       VALUES (?, ?, 'signup', ?, ?)`,
      [r.insertId, code, normalizedEmail, expires]
    );

    try {
      await sendVerificationEmail(normalizedEmail, code);
      console.log(`✅ Verification email sent to ${normalizedEmail}`);
    } catch (e) {
      console.error("sendVerificationEmail failed:", e.message);
    }

    return sendResponse(
      res,
      200,
      true,
      "Account created. Please verify your email before logging in.",
      {
        user: {
          id: r.insertId,
          email: normalizedEmail,
          name: name.trim(),
          isVerified: false,
        },
      }
    );
  });
});

// ---------- FORGOT PASSWORD ----------
export const forgotPassword = handleAsyncError(async (req, res) => {
  const { email } = req.body;

  // Validate email
  const v = validateForgotPassword({ email });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();

  await withConn(async (conn) => {
    const [users] = await conn.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [normalizedEmail]
    );

    // ✅ Email must exist
    if (!users.length) {
      throw new AppError("No account found with this email", 404);
    }

    const user = users[0];

    // ✅ Email must be verified
    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email before requesting a password reset",
        403
      );
    }

    // Generate password reset token
    const token = crypto.randomBytes(20).toString("hex");
    const expires = expireIn(1);
    await conn.execute(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, token, expires]
    );

    // Construct reset URL
    const clientUrls = (process.env.CLIENT_URL || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);
    const baseClientUrl = clientUrls[0] || "http://localhost:5173";
    const resetURL = `${baseClientUrl}/reset-password/${token}`;

    // ✅ Fire-and-forget email sending
    sendPasswordResetEmail(normalizedEmail, resetURL)
      .then(() =>
        console.log(`✅ Password reset email sent to ${normalizedEmail}`)
      )
      .catch((e) =>
        console.error("❌ Password reset email failed:", e.message)
      );

    // Respond immediately
    return sendResponse(res, 200, true, "Password reset link sent.");
  });
});

// ---------- RESET PASSWORD ----------
export const resetPassword = handleAsyncError(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  await withConn(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT pr.*, u.email, u.password AS user_password
       FROM password_resets pr JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ? AND pr.consumed_at IS NULL AND pr.expires_at > NOW()
       LIMIT 1`,
      [token.trim()]
    );
    if (!rows.length) throw new AppError("Invalid or expired reset token", 400);

    const pr = rows[0];
    const same = await bcryptjs.compare(password, pr.user_password);
    if (same) throw new AppError("New password cannot be the same as old", 400);

    const hashed = await bcryptjs.hash(password, 12);
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      pr.user_id,
    ]);
    await conn.execute(
      "UPDATE password_resets SET consumed_at = NOW() WHERE id = ?",
      [pr.id]
    );
    await conn.execute(
      "UPDATE password_resets SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL",
      [pr.user_id]
    );

    try {
      await sendPasswordResetSuccessEmail(pr.email);
    } catch (e) {
      console.error("Password reset success email failed:", e.message);
    }

    return sendResponse(res, 200, true, "Password reset successful");
  });
});

// ---------- RESEND VERIFICATION ----------
export const resendVerification = handleAsyncError(async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) throw new AppError("Email is required", 400);
  const normalizedEmail = email.trim().toLowerCase();

  await withConn(async (conn) => {
    const [users] = await conn.execute(
      "SELECT id, isVerified FROM users WHERE email = ?",
      [normalizedEmail]
    );
    if (!users.length)
      throw new AppError("No account found with this email", 404);
    const user = users[0];
    if (user.isVerified) throw new AppError("Email already verified", 400);

    const code = randomCode();
    const expires = expireIn(24);
    await conn.execute(
      `INSERT INTO email_verification_tokens (user_id, token, purpose, sent_to_email, expires_at)
       VALUES (?, ?, 'signup', ?, ?)`,
      [user.id, code, normalizedEmail, expires]
    );
    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (e) {
      console.error("Resend verification email failed:", e.message);
      throw new AppError("Failed to send verification email", 500);
    }

    return sendResponse(res, 200, true, "Verification code resent.");
  });
});

// ---------- VERIFY EMAIL ----------
export const verifyEmail = handleAsyncError(async (req, res) => {
  const { code } = req.body;
  const v = validateVerifyEmail({ code });
  if (!v.ok) throw new AppError(v.message, 400);

  await withConn(async (conn) => {
    // 1️⃣ Get the user ID associated with the input code (if exists and not expired/consumed)
    const [tokenRows] = await conn.execute(
      `SELECT user_id, created_at, expires_at, consumed_at
       FROM email_verification_tokens
       WHERE token = ? AND purpose = 'signup' AND consumed_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [code.trim()]
    );

    if (!tokenRows.length)
      throw new AppError("Invalid or expired verification code", 400);

    const inputToken = tokenRows[0];

    // 2️⃣ Get the latest token for this user
    const [latestRows] = await conn.execute(
      `SELECT *
       FROM email_verification_tokens
       WHERE user_id = ? AND purpose = 'signup' AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [inputToken.user_id]
    );

    if (!latestRows.length)
      throw new AppError("Invalid or expired verification code", 400);

    const latestToken = latestRows[0];

    // 3️⃣ Check if input code matches the latest token
    if (latestToken.token !== code.trim()) {
      throw new AppError(
        "Invalid verification code. Please use the latest code sent to your email.",
        400
      );
    }

    // ✅ Mark user as verified
    const [userRows] = await conn.execute(
      "SELECT u.id, u.email, u.name, u.role FROM users u WHERE u.id = ?",
      [latestToken.user_id]
    );
    if (!userRows.length) throw new AppError("User not found", 404);

    const user = userRows[0];

    await conn.execute("UPDATE users SET isVerified = TRUE WHERE id = ?", [
      user.id,
    ]);

    await conn.execute(
      "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = ?",
      [latestToken.id]
    );

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (e) {
      console.error("Welcome email failed:", e.message);
    }

    const messages = [
      "🎉 Welcome aboard, :name! Your account is now verified.",
      "🙏 Hello :name, thank you for verifying your account.",
      "✨ Welcome to the system, :name! Enjoy exploring our services.",
      "🌟 Hi :name! Verification complete — you’re all set.",
      "🎊 Welcome, :name! Your email has been verified.",
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)].replace(
      ":name",
      user.name
    );

    try {
      await createNotification({
        user_id: user.id,
        title: "Welcome to Our Lady of Peace and Good Voyage Parish",
        message: msg,
        type: "announcement",
      });
    } catch (err) {
      console.error("Welcome notification failed:", err.message);
    }

    // 🆕 Include email in token payload
    generateTokenAndSetCookie(res, user.id, user.email);

    return sendResponse(res, 200, true, "Email verified successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
      },
    });
  });
});

// ---------- LOGIN ----------
export const login = handleAsyncError(async (req, res) => {
  const { email, password } = req.body;
  const v = validateLogin({ email, password });
  if (!v.ok) throw new AppError(v.message, 400);

  const normalizedEmail = email.trim().toLowerCase();
  await withConn(async (conn) => {
    const [users] = await conn.execute("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (!users.length) throw new AppError("Account not registered", 404);

    const user = users[0];
    if (!user.isVerified)
      throw new AppError("Please verify your email before logging in", 403);

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) throw new AppError("Incorrect password", 401);

    await conn.execute("UPDATE users SET lastLogin = NOW() WHERE id = ?", [
      user.id,
    ]);
    // 🆕 Include email in token payload
    generateTokenAndSetCookie(res, user.id, user.email);

    return sendResponse(res, 200, true, "Logged in successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
        phone: user.phone,
        gender: user.gender,
        dob: user.dob,
        location: user.location,
        avatarUrl: user.avatarUrl,
      },
    });
  });
});

// ---------- LOGOUT ----------
export const logout = handleAsyncError(async (_req, res) => {
  clearAuthCookies(res);
  return sendResponse(res, 200, true, "Logged out successfully");
});

// ---------- REFRESH TOKEN ----------
export const refreshToken = handleAsyncError(async (req, res) => {
  const rt = req.cookies?.refreshToken;
  if (!rt) throw new AppError("Unauthorized - No refresh token", 401);

  let decoded;
  try {
    decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearAuthCookies(res);
    throw new AppError("Unauthorized - Invalid refresh token", 401);
  }

  await withConn(async (conn) => {
    const [users] = await conn.execute(
      "SELECT id, email, name, role, isVerified, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [decoded.userId]
    );
    if (!users.length) throw new AppError("Unauthorized - User not found", 401);
    const user = users[0];
    if (!user.isVerified) throw new AppError("Email not verified", 403);

    // 🆕 Include email in token payload
    const { accessToken, refreshToken: newRefresh } = generateTokenAndSetCookie(
      res,
      decoded.userId,
      user.email
    );

    return sendResponse(res, 200, true, "Tokens refreshed", {
      user,
      accessToken,
      refreshToken: newRefresh,
    });
  });
});

// ---------- CHECK AUTH ----------
export const checkAuth = handleAsyncError(async (req, res) => {
  await withConn(async (conn) => {
    const [users] = await conn.execute(
      "SELECT id, email, name, role, isVerified, lastLogin, phone, gender, dob, location, avatarUrl FROM users WHERE id = ?",
      [req.userId]
    );
    if (!users.length) throw new AppError("User not found", 404);
    return sendResponse(res, 200, true, "User authenticated", {
      user: users[0],
    });
  });
});

// ---------- REAUTH ----------
export const reauth = handleAsyncError(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError("Password is required", 400);

  await withConn(async (conn) => {
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (!rows.length) throw new AppError("User not found", 404);
    const ok = await bcryptjs.compare(password, rows[0].password);
    if (!ok) throw new AppError("Incorrect password", 401);
    return sendResponse(res, 200, true, "Password verified");
  });
});

// ---------- CHANGE PASSWORD ----------
export const changePassword = handleAsyncError(async (req, res) => {
  const { current, next } = req.body;
  if (!current) throw new AppError("Current password required", 400);
  if (!next || next.length < 6)
    throw new AppError("New password must be at least 6 characters", 400);

  await withConn(async (conn) => {
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (!rows.length) throw new AppError("User not found", 404);
    const user = rows[0];

    const ok = await bcryptjs.compare(current, user.password);
    if (!ok) throw new AppError("Current password is incorrect", 401);
    if (await bcryptjs.compare(next, user.password))
      throw new AppError("New password cannot be the same", 400);

    const hashed = await bcryptjs.hash(next, 12);
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      user.id,
    ]);

    try {
      await sendPasswordResetSuccessEmail(user.email);
    } catch (e) {
      console.error("Password change notice email failed:", e.message);
    }

    // 🆕 Include email in token payload
    generateTokenAndSetCookie(res, user.id, user.email);

    return sendResponse(res, 200, true, "Password changed successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: !!user.isVerified,
      },
    });
  });
});

// ---------- DELETE ACCOUNT ----------
export const deleteAccount = handleAsyncError(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new AppError("Password is required", 400);

  await withConn(async (conn) => {
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (!rows.length) throw new AppError("User not found", 404);
    const user = rows[0];
    if (!(await bcryptjs.compare(password, user.password)))
      throw new AppError("Incorrect password", 401);

    await conn.execute("DELETE FROM users WHERE id = ?", [user.id]);
    clearAuthCookies(res);
    return sendResponse(res, 200, true, "Account deleted");
  });
});

// ---------- CHANGE EMAIL REQUEST ----------
export const changeEmailRequest = handleAsyncError(async (req, res) => {
  let { email } = req.body;
  if (!email?.trim())
    throw new AppError("Please enter your email address", 400);
  email = email.trim().toLowerCase();

  await withConn(async (conn) => {
    const [me] = await conn.execute(
      "SELECT id, email FROM users WHERE id = ?",
      [req.userId]
    );
    if (!me.length) throw new AppError("User not found", 404);
    if (me[0].email === email) throw new AppError("New email must differ", 400);

    const [dup] = await conn.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (dup.length) throw new AppError("Email is already in use", 400);

    const code = randomCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await conn.execute(
      `INSERT INTO change_email_requests (user_id, new_email, code, expires_at)
       VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE
       code = VALUES(code), expires_at = VALUES(expires_at), consumed_at = NULL, created_at = CURRENT_TIMESTAMP`,
      [req.userId, email, code, expires]
    );
    try {
      await sendChangeEmailCode(email, code);
    } catch (e) {
      console.error("sendChangeEmailCode failed:", e.message);
    }
    return sendResponse(res, 200, true, "Verification code sent");
  });
});

// ---------- CHANGE EMAIL CONFIRM ----------
export const changeEmailConfirm = handleAsyncError(async (req, res) => {
  let { email, code } = req.body;
  if (!email?.trim()) throw new AppError("Email is required", 400);
  if (!code?.trim()) throw new AppError("Verification code is required", 400);
  email = email.trim().toLowerCase();
  code = code.trim();

  await withConn(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM change_email_requests
       WHERE user_id = ? AND new_email = ? AND code = ?
         AND consumed_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [req.userId, email, code]
    );
    if (!rows.length)
      throw new AppError("Invalid or expired verification code", 400);

    const reqRow = rows[0];
    const [dup] = await conn.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.userId]
    );
    if (dup.length) throw new AppError("Email is already in use", 400);

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
  });
});
