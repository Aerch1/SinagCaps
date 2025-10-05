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

import {
  getAppointmentRequirements,
  updateAppointmentRequirements,
  completeAppointment,
  createRequirement,
  updateRequirement,
  deleteRequirement,
} from "../controllers/admin/appointment.process.controller.js";

import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ---------------- Appointment Management ---------------- */
router.get("/appointments", verifyToken, isAdmin, getAppointments);
router.post("/appointments/filter", verifyToken, isAdmin, filterAppointments);
router.get("/appointments/export", verifyToken, isAdmin, exportAppointments);
router.post("/appointments", verifyToken, isAdmin, createAppointmentAdmin);
router.patch("/appointments/:id", verifyToken, isAdmin, updateAppointmentAdmin);
router.get("/appointments/:id", verifyToken, isAdmin, getAppointmentById);

/* ---------------- Appointment Processing ---------------- */
// ✅ these now only deal with `completed`, no status column in appointment_requirements
router.get(
  "/appointments/:id/requirements",
  verifyToken,
  isAdmin,
  getAppointmentRequirements
);
router.patch(
  "/appointments/:id/requirements",
  verifyToken,
  isAdmin,
  updateAppointmentRequirements
);
router.patch(
  "/appointments/:id/complete",
  verifyToken,
  isAdmin,
  completeAppointment
);

/* ---------------- Requirement Management ---------------- */
router.post("/requirements", verifyToken, isAdmin, createRequirement);
router.patch("/requirements/:id", verifyToken, isAdmin, updateRequirement);
router.delete("/requirements/:id", verifyToken, isAdmin, deleteRequirement);

export default router;
