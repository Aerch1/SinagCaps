// routes/public.appointments.routes.js
import express from "express";
import {
  createPublicAppointment,
  getPublicAppointment,
} from "../controllers/public/public.appointments.controller.js";

const router = express.Router();

// Create appointment (public)
router.post("/", createPublicAppointment);

// Get appointment by ID
router.get("/:id", getPublicAppointment);

export default router;
