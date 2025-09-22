import { Router } from "express";
import {
  getAppointments,
  filterAppointments,
  exportAppointments,
} from "../controllers/adminAppointments.controller.js";

const router = Router();

// basic list (just pagination, no filters)
router.get("/", getAppointments);

// filtered list (search + service + status)
router.post("/filter", filterAppointments);

router.get("/export", exportAppointments);

export default router;
