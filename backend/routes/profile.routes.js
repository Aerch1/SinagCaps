// src/routes/profile.routes.js
import { Router } from "express";
import { updateProfile } from "../controllers/profile.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

// Frontend posts to `${API_URL}/profile`
router.post("/", verifyToken, updateProfile);

export default router;
