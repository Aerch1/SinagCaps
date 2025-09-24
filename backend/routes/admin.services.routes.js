import { Router } from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/admin/services.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ---------------- Services Management ---------------- */
router.get("/", verifyToken, isAdmin, getServices);
router.post("/", verifyToken, isAdmin, createService);
router.patch("/:id", verifyToken, isAdmin, updateService);
router.delete("/:id", verifyToken, isAdmin, deleteService);

export default router;
