// src/routes/admin.routes.js
import { Router } from "express";
import {
  getAppointments,
  filterAppointments,
  createAppointmentAdmin,
  updateAppointmentAdmin,
  getAppointmentById,
  exportAppointments,
} from "../controllers/admin/admin.appointments.controller.js";

import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ---------------- Appointment Management ---------------- */

// List all (paginated)
router.get("/appointments", verifyToken, isAdmin, getAppointments);

// Advanced filtering
router.post("/appointments/filter", verifyToken, isAdmin, filterAppointments);

// Export CSV
router.get("/appointments/export", verifyToken, isAdmin, exportAppointments);

// Create new appointment (admin-only)
router.post("/appointments", verifyToken, isAdmin, createAppointmentAdmin);

// Update appointment
router.patch("/appointments/:id", verifyToken, isAdmin, updateAppointmentAdmin);

// View single appointment
router.get("/appointments/:id", verifyToken, isAdmin, getAppointmentById);

export default router;
