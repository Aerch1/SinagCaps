// src/routes/public.documents.routes.js
import express from "express";
import {
  createPublicDocumentRequest,
  getMyDocumentRequests,
  getMyDocumentRequestDetails,
} from "../controllers/public/public.documents.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public: create a document request
router.post("/", createPublicDocumentRequest);

// Auth-protected: everything below requires a valid token
router.use(verifyToken);

router.get("/my", getMyDocumentRequests);
router.get("/:id", getMyDocumentRequestDetails);

export default router;
