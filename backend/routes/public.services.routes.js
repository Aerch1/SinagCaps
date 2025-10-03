import { Router } from "express";
import { getPublicServices } from "../controllers/public/services.controller.js";

const router = Router();

// No middleware → public endpoint
router.get("/", getPublicServices);

export default router;
