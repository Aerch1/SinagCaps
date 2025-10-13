import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const cookieBase = {
  httpOnly: true,
  secure: isProd, // ✅ secure only in production
  sameSite: isProd ? "none" : "lax", // ✅ allow cross-domain cookies
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const generateTokenAndSetCookie = (res, userId, userEmail = null) => {
  const jtiAccess = crypto.randomBytes(16).toString("hex");
  const jtiRefresh = crypto.randomBytes(16).toString("hex");

  // 🧠 Include email in payload only if provided
  const payload = userEmail ? { userId, email: userEmail } : { userId };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
    jwtid: jtiAccess,
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: jtiRefresh,
  });

  // 🍪 Set cookies
  res.cookie("token", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
};

/**
 * 🧼 Clear Auth Cookies
 */
export const clearAuthCookies = (res) => {
  const base = { ...cookieBase, maxAge: undefined };
  res.clearCookie("token", base);
  res.clearCookie("refreshToken", base);
};
