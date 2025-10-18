import express from "express";
import {
  requestReschedule,
  requestCancel,
} from "../controllers/public/public.appointmentRequestsController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:id/request-reschedule", verifyToken, requestReschedule);
router.post("/:id/request-cancel", verifyToken, requestCancel);

export default router;
