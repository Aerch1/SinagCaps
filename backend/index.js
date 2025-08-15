// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.routes.js";

// Load env first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// If you run behind a reverse proxy (e.g., nginx, Render, Vercel Edge)
// this helps secure cookies work (secure: true) by honoring X-Forwarded-* headers.
app.set("trust proxy", 1);

// CORS: only needed in development (dev server runs on a different origin)
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    })
  );
}

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL,
  });
});

// In production, serve the frontend build from the same origin
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON format" });
  }
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ success: false, message: "Request entity too large" });
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
});

// Start
app.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server on :${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
});

// Optional hard exits
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
