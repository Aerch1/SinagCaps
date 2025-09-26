import express from "express";
import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  toggleBlockWeekday,
} from "../controllers/admin/availabilityAdminController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// 🔐 protect all admin availability routes
router.use(verifyToken, isAdmin);

/* ==============================
   Unified Rules Routes
   ============================== */
router.get("/:serviceId/rules", getRules);
router.post("/:serviceId/rules", addRule);
router.put("/rules/:id", updateRule);
router.delete("/rules/:id", deleteRule);

/* Toggle blocking for a weekday (recurring) */
router.patch("/:serviceId/block/:weekday", toggleBlockWeekday);

export default router;
