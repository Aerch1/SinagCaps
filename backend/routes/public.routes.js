// src/routes/public.routes.js
import { Router } from "express";
import {
  createAppointmentPublic,
//   getAppointmentByIdPublic,
//   listAppointmentsByUser,
} from "../controllers/public/appointments.controller.js";

import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

/* ---------------- Public Appointment Endpoints ---------------- */

// Create appointment (✅ must be logged in)
router.post("/appointments", verifyToken, createAppointmentPublic);

// // View a single appointment (by ID) – anyone logged in can view their own
// router.get("/appointments/:id", verifyToken, getAppointmentByIdPublic);

// // List all appointments of the logged-in user
// router.get("/appointments", verifyToken, listAppointmentsByUser);

export default router;
