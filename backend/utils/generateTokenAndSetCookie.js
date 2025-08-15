// backend/utils/generateTokenAndSetCookie.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const cookieBase = {
  httpOnly: true,
  secure: isProd, // HTTPS required in prod
  sameSite: isProd ? "strict" : "lax", // friendlier in dev
  path: "/",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

export const generateTokenAndSetCookie = (res, userId) => {
  const jtiAccess = crypto.randomBytes(16).toString("hex");
  const jtiRefresh = crypto.randomBytes(16).toString("hex");

  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
    jwtid: jtiAccess,
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
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
