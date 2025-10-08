import express from "express";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  deleteAdminNotification,
} from "../controllers/admin/admin.notifications.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getAdminNotifications);
router.patch("/:id/read", verifyToken, markAdminNotificationRead);
router.delete("/:id", verifyToken, deleteAdminNotification);

export default router;
