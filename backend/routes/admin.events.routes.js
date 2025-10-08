import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

import {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
    getUpcomingEvents, // ✅ import

} from "../controllers/admin/admin.events.controller.js";

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

/* ==================================================
   ROUTES
================================================== */
router.get("/", getAllEvents);
router.get("/upcoming", getUpcomingEvents); // ✅ add this line

router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
