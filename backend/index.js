import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.routes.js";
import adminRoutes from "./routes/admin.appointments.routes.js";
import publicRoutes from "./routes/public.routes.js";
import serviceRoutes from "./routes/admin.services.routes.js";
import churchHoursRoutes from "./routes/churchHoursRoutes.js";
import adminAvailabilityRoutes from "./routes/admin.availability.routes.js"; // ✅ unified rules

import availabilityRoutes from "./routes/availability.js";

// Load env first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// trust proxy (for secure cookies behind reverse proxy)
app.set("trust proxy", 1);

// CORS (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5174",
      credentials: true,
    })
  );
}

app.use(express.json());
app.use(cookieParser());

/* ===============================
   ROUTES
   =============================== */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes); // appointments
app.use("/api/public", publicRoutes);
app.use("/api/admin/services", serviceRoutes);
app.use("/api/admin/church-hours", churchHoursRoutes);
app.use("/api/admin/availability", adminAvailabilityRoutes); // ✅ unified rules
app.use("/api/availability", availabilityRoutes);

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

// Production: serve frontend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

/* ===============================
   ERROR HANDLING
   =============================== */
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

/* ===============================
   START SERVER
   =============================== */
app.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on :${PORT}`);
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
