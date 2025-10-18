import express from "express";
import {
  requestReschedule,
  requestCancel,
  getAllUserRequests,
  approveRequest,
  denyRequest,
} from "../controllers/public/public.appointmentRequestsController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

/* =========================
   Public User Routes
========================= */
router.post("/:id/request-reschedule", verifyToken, requestReschedule);
router.post("/:id/request-cancel", verifyToken, requestCancel);

/* =========================
   Admin Routes
========================= */
router.get("/all-requests", verifyToken, isAdmin, getAllUserRequests); // fetch all requests
router.patch("/:requestId/approve", verifyToken, isAdmin, approveRequest);
router.patch("/:requestId/deny", verifyToken, isAdmin, denyRequest);

export default router;
