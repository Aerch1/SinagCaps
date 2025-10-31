import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createPublicAppointment,
  getPublicAppointment,
  getMyAppointments,
} from "../controllers/public/public.appointments.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// ✅ Auto-create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/ directory");
}

// ✅ Configure multer with validation and limits
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Allowed file extensions
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX are allowed."
      )
    );
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 files per request
  },
});

// ✅ Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB per file.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 10 files per upload.",
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    // Custom errors (e.g., from fileFilter)
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next();
};

// ✅ Create appointment (with document upload support)
router.post(
  "/",
  upload.array("files"),
  handleMulterError,
  createPublicAppointment
);

// 🔒 Fetch user's appointments
router.get("/my", verifyToken, getMyAppointments);

// 🔒 Get specific appointment details
router.get("/:id", verifyToken, getPublicAppointment);

export default router;
