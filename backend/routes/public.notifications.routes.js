import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getMyNotifications,
  markNotificationRead,
  deleteNotification,
} from "../controllers/public/public.notifications.controller.js";

const router = express.Router();

router.get("/my", verifyToken, getMyNotifications);
router.patch("/:id/read", verifyToken, markNotificationRead);
router.delete("/:id", verifyToken, deleteNotification);

export default router;
