// src/routes/public.documents.routes.js
import express from "express";
import { createPublicDocumentRequest } from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Require login
router.post("/", verifyToken, createPublicDocumentRequest);

export default router;
