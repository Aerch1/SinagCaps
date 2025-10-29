import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createPublicAppointment,
  getPublicAppointment,
  getMyAppointments,
} from "../controllers/public/public.appointments.controller.js";

// ------------------------------------
// Multer config (memory storage)
// ------------------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// 🔒 Require login for all user-specific operations
// ✅ accepts multiple images under "documents"
router.post(
  "/",
  verifyToken,
  upload.array("documents", 10), // <-- allow up to 10 images
  createPublicAppointment
);

router.get("/my", verifyToken, getMyAppointments);
router.get("/:id", verifyToken, getPublicAppointment); // ✅ now protected

export default router;
