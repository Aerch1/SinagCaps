// src/routes/availability.routes.js
import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

import {
  // PUBLIC (reads)
  getMonthAvailability,
  getDayTimes,
  // ADMIN (writes)
  upsertWeeklyTemplate,
  upsertWeeklyBlock,
  upsertDateOverride,
  deleteDateOverride,
  // (optional) legacy single-writer if you still want it
  // updateWeeklyAvailability,
} from "../controllers/availability.controller.js";

const router = Router();

/* -------------------- PUBLIC READS -------------------- */
// Month payload for a service (month = 1..12)
router.get("/:service/month/:year/:month", getMonthAvailability);

// Optional: details for a single ISO date, e.g. 2025-09-19
router.get("/:service/day/:isoDate", getDayTimes);

/* -------------------- ADMIN WRITES -------------------- */
// Weekly templates (day-of-week -> times + capacities, default slots)
router.post("/:service/templates", verifyToken, isAdmin, upsertWeeklyTemplate);

// Weekly blocks (toggle weekdays off/on)
router.post("/:service/weekly-blocks", verifyToken, isAdmin, upsertWeeklyBlock);

// Date-level overrides (set status / custom times / custom capacities)
router.post("/:service/overrides", verifyToken, isAdmin, upsertDateOverride);

// Remove a date-level override completely
router.delete(
  "/:service/overrides/:date",
  verifyToken,
  isAdmin,
  deleteDateOverride
);

/* -------------------- (OPTIONAL) BACKWARD COMPAT -------------------- */
// If your admin UI currently posts everything in one go to POST "/:service",
// you can keep a legacy handler here while you migrate:
// router.post("/:service", verifyToken, isAdmin, updateWeeklyAvailability);

export default router;
