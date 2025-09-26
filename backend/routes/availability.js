import express from "express";
import { getAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

// /api/availability/:service_id/:date
router.get("/:service_id/:date", getAvailability);

export default router;
