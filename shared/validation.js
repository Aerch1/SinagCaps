// Keep this file pure & dependency-free so it runs in Node and the browser.

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup({ name, email, password }) {
  if (!name?.trim())
    return { ok: false, message: "Please enter your full name" };
  if (!email?.trim())
    return { ok: false, message: "Please enter your email address" };
  if (!emailRegex.test(email.trim()))
    return { ok: false, message: "Please enter a valid email address" };
  if (!password) return { ok: false, message: "Please enter a password" };
  if (password.length < 6)
    return {
      ok: false,
      message: "Password must be at least 6 characters long",
    };
  return { ok: true };
}

export function validateLogin({ email, password }) {
  if (!email?.trim())
    return { ok: false, message: "Please enter your email address" };
  if (!emailRegex.test(email.trim()))
    return { ok: false, message: "Please enter a valid email address" };
  if (!password) return { ok: false, message: "Please enter your password" };
  return { ok: true };
}

export function validateVerifyEmail({ code }) {
  if (!code?.trim())
    return { ok: false, message: "Please enter the verification code" };
  if (code.trim().length !== 6)
    return { ok: false, message: "Verification code must be 6 digits" };
  if (!/^\d{6}$/.test(code.trim()))
    return { ok: false, message: "Please enter only numbers" };
  return { ok: true };
}

export function validateForgotPassword({ email }) {
  if (!email?.trim())
    return { ok: false, message: "Please enter your email address" };
  if (!emailRegex.test(email.trim()))
    return { ok: false, message: "Please enter a valid email address" };
  return { ok: true };
}

export function validateResetPassword({ token, password }) {
  if (!token?.trim()) return { ok: false, message: "Invalid reset link" };
  if (!password) return { ok: false, message: "Please enter a new password" };
  if (password.length < 6)
    return {
      ok: false,
      message: "Password must be at least 6 characters long",
    };
  return { ok: true };
}

// ✅ NEW
export function validateChangeEmail({ email }) {
  if (!email?.trim())
    return { ok: false, message: "Please enter your email address" };
  if (!emailRegex.test(email.trim()))
    return { ok: false, message: "Please enter a valid email address" };
  return { ok: true };
}
