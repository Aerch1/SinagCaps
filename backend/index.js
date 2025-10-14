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
import publicDocumentsRoutes from "./routes/public.documents.routes.js";
import publicNotificationsRoutes from "./routes/public.notifications.routes.js";
import adminNotificationsRoutes from "./routes/admin.notifications.routes.js";
import adminDocumentRequestsRoutes from "./routes/admin.documentrequests.routes.js";
import publicContactRoutes from "./routes/public.contact.routes.js";
import adminUserRoutes from "./routes/admin.users.routes.js";
import adminSecurityRoutes from "./routes/admin.security.routes.js";
import reportRoutes from "./routes/admin.reports.routes.js";
import backupRoutes from "./routes/admin.backup.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// ✅ Properly split CLIENT_URL into an array
const clientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// ✅ Add your dev/testing domains too
const allowedOrigins = [
  ...clientUrls,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://sinagcaps.vercel.app",
  "https://sinag-caps.vercel.app",
  "https://lodlod.olpgvp.com",
  "https://olpgvp.com",
];

// ✅ Updated CORS config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
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
app.use("/api/public/documents", publicDocumentsRoutes);
app.use("/api/notifications", publicNotificationsRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api/admin/document-requests", adminDocumentRequestsRoutes);
app.use("/api/public", publicContactRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/security", adminSecurityRoutes);
app.use("/api/admin/reports", reportRoutes);
app.use("/api/admin/backup", backupRoutes);

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
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: ${process.env.CLIENT_URL}`);
  console.log(`☁️  Cloudinary Folder: ${process.env.CLOUDINARY_FOLDER}`);
  console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE}`);
  console.log("Current NODE_ENV:", process.env.NODE_ENV);
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
