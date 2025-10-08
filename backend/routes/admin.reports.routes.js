import express from "express";
import { generateSystemReport } from "../controllers/admin.reports.controller.js";

const router = express.Router();

router.get("/generate", generateSystemReport);

export default router;
