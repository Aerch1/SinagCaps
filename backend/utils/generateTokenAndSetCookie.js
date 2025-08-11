// utils/generateTokenAndSetCookie.js
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateTokenAndSetCookie = (res, userId) => {
  // Unique IDs so tokens differ on every issuance
  const jtiAccess = crypto.randomBytes(16).toString("hex");
  const jtiRefresh = crypto.randomBytes(16).toString("hex");

  // Access Token (15min expiry)
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
    jwtid: jtiAccess,
  });

  // Refresh Token (7 days expiry)
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    jwtid: jtiRefresh,
  });

  // Set cookies
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
};
