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

export function validateProfile({ name, phone, gender, dob, location }) {
  if (!name?.trim()) return { ok: false, message: "Please enter your full name." };
  if (!phone?.trim()) return { ok: false, message: "Please enter your phone number." };
  if (!/^[0-9()+\-.\s]{7,20}$/.test(phone.trim()))
    return { ok: false, message: "Please enter a valid phone number." };

  const allowed = ["Male", "Female", "Non-binary", "Prefer not to say"];
  if (!gender || !allowed.includes(gender))
    return { ok: false, message: "Please select a gender." };

  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob))
    return { ok: false, message: "Please select a valid date of birth." };

  // Simple actual-date check (prevents 2024-02-31 etc.)
  const [y, m, d] = dob.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d)
    return { ok: false, message: "Please select a valid date of birth." };

  // Optional: basic age sanity (0–120)
  const today = new Date();
  const age = today.getFullYear() - y - (today < new Date(today.getFullYear(), m - 1, d) ? 1 : 0);
  if (age < 0 || age > 120) return { ok: false, message: "Please enter a realistic date of birth." };

  if (!location?.trim()) return { ok: false, message: "Please enter your location." };

  return { ok: true };
}