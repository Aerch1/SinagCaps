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

// User request routes
router.post("/:id/request-reschedule", verifyToken, requestReschedule);
router.post("/:id/request-cancel", verifyToken, requestCancel);
router.get("/user-requests", verifyToken, isAdmin, getAllUserRequests);

// Admin routes for approving/denying requests
router.patch("/requests/:requestId/approve", verifyToken, approveRequest);
router.patch("/requests/:requestId/deny", verifyToken, denyRequest);

export default router;
