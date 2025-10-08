import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getAllDocumentRequests,
  updateDocumentStatus,
  deleteDocumentRequest,
  createDocumentRequest,
} from "../controllers/admin/admin.documentRequests.controller.js";

const router = express.Router();

// ✅ Require authentication and admin access for all
router.use(verifyToken, isAdmin);

// ✅ Admin-only routes
router.get("/", getAllDocumentRequests);
router.post("/", createDocumentRequest);
router.patch("/:id/status", updateDocumentStatus);
router.delete("/:id", deleteDocumentRequest);

export default router;
