import { Router } from "express";
import {
  getAppointments,
  filterAppointments,
  createAppointmentAdmin,
  updateAppointmentAdmin,
  getAppointmentById,
  getTodayAppointments,
  getAppointmentConflicts, // ✅ Add this import
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
router.get("/appointments/today", verifyToken, isAdmin, getTodayAppointments);
router.post("/appointments", verifyToken, isAdmin, createAppointmentAdmin);
router.get("/appointments/conflicts", verifyToken, isAdmin, getAppointmentConflicts);
router.patch("/appointments/:id", verifyToken, isAdmin, updateAppointmentAdmin);
router.get("/appointments/:id", verifyToken, isAdmin, getAppointmentById);

// ✅ Add this route — used by useConflictCheck.js

/* ---------------- Appointment Processing ---------------- */
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
