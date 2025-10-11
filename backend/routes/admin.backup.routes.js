// src/routes/admin.backup.routes.js
import express from "express";
import multer from "multer";
import {
  exportBackup,
  importBackup,
} from "../controllers/admin/admin.backup.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🔐 Only admin can access
router.get("/export", verifyToken, exportBackup);
router.post("/import", verifyToken, upload.single("file"), importBackup);

export default router;
