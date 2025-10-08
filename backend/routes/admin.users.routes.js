import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  createUserAccount, // ✅ add import
} from "../controllers/admin.users.controller.js";

const router = express.Router();

// ✅ Protected routes for admin
router.get("/", verifyToken, getAllUsers);
router.post("/create", verifyToken, createUserAccount); // ✅ new route
router.patch("/:id/status", verifyToken, updateUserStatus);
router.delete("/:id", verifyToken, deleteUser);

export default router;
