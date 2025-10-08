// src/routes/public.contact.routes.js
import express from "express";
import { sendContactMessage } from "../controllers/public/public.contact.controller.js";

const router = express.Router();

router.post("/contact", sendContactMessage);

export default router;
