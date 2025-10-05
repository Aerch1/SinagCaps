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
import scheduleRules from "./routes/admin.availability.routes.js";
import availabilityRoutes from "./routes/availableSlots.routes.js";
import publicServicesRoutes from "./routes/public.services.routes.js";
import publicAppointmentsRoutes from "./routes/public.appointments.routes.js";
import adminDashboardRoutes from "./routes/admin.dashboard.routes.js";
import adminEventRoutes from "./routes/admin.events.routes.js";
import adminAdvisoriesRoutes from "./routes/admin.advisories.routes.js";
import adminAnnouncementsRoutes from "./routes/admin.announcements.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

/* ===============================
   CORS
=============================== */
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* ===============================
   ROUTES
=============================== */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/services", serviceRoutes);
app.use("/api/admin/church-hours", churchHoursRoutes);
app.use("/api/admin/availability", scheduleRules);
app.use("/api/availability", availabilityRoutes);
app.use("/api/public/services", publicServicesRoutes);
app.use("/api/appointments", publicAppointmentsRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/events", adminEventRoutes);

app.use("/api/admin/advisories", adminAdvisoriesRoutes);
app.use("/api/admin/announcements", adminAnnouncementsRoutes);
app.use("/api/chat", chatbotRoutes);

/* ===============================
   HEALTH CHECK
=============================== */
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
      .json({ success: false, message: "Request too large" });
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: ${process.env.CLIENT_URL}`);
  console.log(`☁️  Cloudinary Folder: ${process.env.CLOUDINARY_FOLDER}`);
  console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE}`);
});

/* ===============================
   SAFETY HANDLERS
=============================== */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  process.exit(0);
});
