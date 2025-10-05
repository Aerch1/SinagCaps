import express from "express";
import {
  createAdvisory,
  getAllAdvisories,
  updateAdvisory,
  deleteAdvisory,toggleAdvisoryStatus
} from "../controllers/admin/admin.advisories.controller.js";

const router = express.Router();

router.get("/", getAllAdvisories);
router.post("/", createAdvisory);
router.patch("/:id", updateAdvisory);
router.delete("/:id", deleteAdvisory);

router.patch("/:id/toggle", toggleAdvisoryStatus);

export default router;
