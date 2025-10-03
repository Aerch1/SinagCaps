// src/routes/admin.dashboard.routes.js
import express from "express";
import {
  getKpiData,
  getAreaChartData,
  getBarChartData,
} from "../controllers/admin/admin.dashboard.controller.js";

const router = express.Router();

router.get("/kpis", getKpiData);
router.get("/area", getAreaChartData);
router.get("/bar", getBarChartData);

export default router;
