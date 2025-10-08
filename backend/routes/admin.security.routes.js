import express from "express";
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  forgotAdminPassword,
  resetAdminPassword,
} from "../controllers/admin/admin.security.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/profile", verifyToken, isAdmin, getAdminProfile);
router.patch("/profile", verifyToken, isAdmin, updateAdminProfile);
router.patch("/change-password", verifyToken, isAdmin, changeAdminPassword);

// 🔹 Forgot + Reset Password (no token required)
router.post("/forgot-password", forgotAdminPassword);
router.post("/reset-password/:token", resetAdminPassword);

export default router;
