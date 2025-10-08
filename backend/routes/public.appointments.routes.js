import express from "express";
import {
  createPublicAppointment,
  getPublicAppointment,
  getMyAppointments,
} from "../controllers/public/public.appointments.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// 🔒 Require login for all user-specific operations
router.post("/", verifyToken, createPublicAppointment);
router.get("/my", verifyToken, getMyAppointments);
router.get("/:id", verifyToken, getPublicAppointment); // ✅ now protected

export default router;
