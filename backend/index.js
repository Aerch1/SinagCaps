import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.route.js";
import profileRoutes from "./routes/profile.routes.js";
import adminRoutes from "./routes/admin.appointments.routes.js";
import serviceRoutes from "./routes/admin.services.routes.js";
import churchHoursRoutes from "./routes/churchHoursRoutes.js";
import scheduleRules from "./routes/admin.availability.routes.js"; // ✅ unified rules
import availabilityRoutes from "./routes/availableSlots.routes.js";

import publicServicesRoutes from "./routes/public.services.routes.js";

import publicAppointmentsRoutes from "./routes/public.appointments.routes.js";

import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";

// Load env first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL, // prod frontend domain
  "http://localhost:5174", // dev
  "http://127.0.0.1:5174", // optional extra for dev
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow mobile apps, curl, etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// trust proxy (for secure cookies behind reverse proxy)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

/* ===============================
   ROUTES
   =============================== */
app.use("/api/auth", authRoutes); //authentication
app.use("/api/profile", profileRoutes); //user profile
app.use("/api/admin", adminRoutes); // appointments
app.use("/api/admin/services", serviceRoutes);
app.use("/api/admin/church-hours", churchHoursRoutes);
app.use("/api/admin/availability", scheduleRules); // ✅ unified rules
app.use("/api/availability", availabilityRoutes);
app.use("/api/public/services", publicServicesRoutes);
app.use("/api/appointments", publicAppointmentsRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

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
