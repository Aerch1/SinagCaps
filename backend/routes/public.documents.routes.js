import express from "express";
import {
  createPublicDocumentRequest,
  getMyDocumentRequests,
  getMyDocumentRequestDetails, // ✅ single request details route
} from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/* =====================================================
   📤 Public Route: Create Document Request
   — Works even if user is not logged in
===================================================== */
router.post("/", createPublicDocumentRequest);

/* =====================================================
   🧑 Authenticated Routes (Requires Token)
===================================================== */
router.use(verifyToken);

// 📥 Get all document requests of the logged-in user
router.get("/my", getMyDocumentRequests);

// 📄 Get single document request details of logged-in user
router.get("/my/:id", getMyDocumentRequestDetails);

export default router;
