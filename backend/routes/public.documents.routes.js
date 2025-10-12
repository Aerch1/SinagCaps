// src/routes/public.documents.routes.js
import express from "express";
import {
  createPublicDocumentRequest,
  getMyDocumentRequests,
  getMyDocumentRequestDetails, // ✅ added single request route
} from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* =====================================================
   📤 Public route: Create document request
   — Works even if user is not logged in
===================================================== */
router.post("/", createPublicDocumentRequest);

/* =====================================================
   🧑 Authenticated routes (Requires Token)
===================================================== */
router.use(verifyToken);

// 📥 Get all document requests of the logged-in user
router.get("/my", getMyDocumentRequests);

// 📄 Get single document request details of logged-in user
router.get("/my/:id", getMyDocumentRequestDetails);

export default router;
