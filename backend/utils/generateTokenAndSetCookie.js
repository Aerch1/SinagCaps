// utils/generateTokenAndSetCookie.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const cookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const generateTokenAndSetCookie = (res, userId, email = null) => {
  const jtiAccess = crypto.randomBytes(16).toString("hex");
  const jtiRefresh = crypto.randomBytes(16).toString("hex");

  // ✅ Include email if provided, fallback to just userId if not
  const payload = email ? { userId, email } : { userId };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
    jwtid: jtiAccess,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: jtiRefresh,
  });

  res.cookie("token", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

export const clearAuthCookies = (res) => {
  const base = { ...cookieBase, maxAge: undefined };
  res.clearCookie("token", base);
  res.clearCookie("refreshToken", base);
};
