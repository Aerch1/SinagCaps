import express from "express";
import {
  login,
  logout,
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  refreshToken,
  reauth, // NEW
  changePassword,
  deleteAccount,
  changeEmailRequest, // NEW
  changeEmailConfirm, // NEW
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);

// NEW
router.post("/reauth", verifyToken, reauth);
router.post("/change-password", verifyToken, changePassword);
router.post("/delete-account", verifyToken, deleteAccount);
router.post("/change-email/request", verifyToken, changeEmailRequest);
router.post("/change-email/confirm", verifyToken, changeEmailConfirm);

export default router;
