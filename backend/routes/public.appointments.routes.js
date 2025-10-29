import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createPublicAppointment,
  getPublicAppointment,
  getMyAppointments,
} from "../controllers/public/public.appointments.controller.js";

// Multer config (store files in memory for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// POST /api/public/appointments — create new appointment w/ optional images
router.post(
  "/",
  verifyToken,
  upload.array("documents", 10), // accept up to 10 images under "documents"
  createPublicAppointment
);

// GET /api/public/appointments/my — get logged-in user's appointments
router.get("/my", verifyToken, getMyAppointments);

// GET /api/public/appointments/:id — get specific appointment
router.get("/:id", verifyToken, getPublicAppointment);

export default router;
