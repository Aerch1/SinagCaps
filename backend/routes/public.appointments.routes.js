import express from "express";
import {
  createPublicAppointment,
  getPublicAppointment,
  getMyAppointments,
} from "../controllers/public/public.appointments.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/* ==================================================
   CLOUDINARY CONFIG
================================================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ==================================================
   MULTER STORAGE (Cloudinary)
================================================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: process.env.CLOUDINARY_FOLDER || "uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }],
  },
});

const upload = multer({ storage });

// 🔒 Require login for all user-specific operations
// Add `upload.single("document")` to handle the image
router.post(
  "/",
  verifyToken,
  upload.single("document"),
  createPublicAppointment
);
router.get("/my", verifyToken, getMyAppointments);
router.get("/:id", verifyToken, getPublicAppointment); // ✅ now protected

export default router;
