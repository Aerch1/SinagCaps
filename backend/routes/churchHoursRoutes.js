// routes/churchHoursRoutes.js
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getChurchHours,
  updateChurchHour,
  resetChurchHours,
} from "../controllers/admin/churchHoursController.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getChurchHours);
router.put("/:day", updateChurchHour);
router.post("/reset", resetChurchHours);

export default router;
