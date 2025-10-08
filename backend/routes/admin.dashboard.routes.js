// src/routes/admin.dashboard.routes.js
import express from "express";
import {
  getKpiData,
  getAreaChartData,
  getBarChartData,
  getCalendarKpis
} from "../controllers/admin/admin.dashboard.controller.js";

const router = express.Router();

router.get("/kpis", getKpiData);
router.get("/calendar/kpis", getCalendarKpis);  // calendar analytics page

router.get("/area", getAreaChartData);
router.get("/bar", getBarChartData);

export default router;
