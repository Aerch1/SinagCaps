import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/admin/admin.announcements.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

/* ------------------- ADMIN ANNOUNCEMENTS ------------------- */
router.get("/", getAllAnnouncements); // anyone can fetch list
router.get("/:id", getAnnouncementById);

// ✅ protected admin-only routes
router.post("/", verifyToken, isAdmin, createAnnouncement);
router.put("/:id", verifyToken, isAdmin, updateAnnouncement);
router.delete("/:id", verifyToken, isAdmin, deleteAnnouncement);

export default router;
