// src/routes/public.documents.routes.js
import express from "express";
import {
  createPublicDocumentRequest,
  fetchPublicDocumentRequests,
} from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public: create a document request
router.post("/", createPublicDocumentRequest);
router.get("/my", fetchPublicDocumentRequests);

export default router;
