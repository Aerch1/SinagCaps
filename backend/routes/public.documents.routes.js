// src/routes/public.documents.routes.js
import express from "express";
import {
  createPublicDocumentRequest,
  getMyDocumentRequests,
  getMyDocumentRequestDetails,
} from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* =====================================================
   📤 Create Document Request (Public - No Auth Required)
===================================================== */
router.post("/", createPublicDocumentRequest);

/* =====================================================
   📥 Get My Document Requests (Preview - Auth Required)
===================================================== */
router.get("/my", verifyToken, getMyDocumentRequests);

/* =====================================================
   📄 Get Single Document Request Details (Auth Required)
===================================================== */
router.get("/:id", verifyToken, getMyDocumentRequestDetails);

export default router;
