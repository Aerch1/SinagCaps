// src/routes/public.documents.routes.js
import express from "express";
import { createPublicDocumentRequest } from "../controllers/public/public.documents.controller.js";

const router = express.Router();

// ✅ Public route — no authentication required
router.post("/", createPublicDocumentRequest);

export default router;
