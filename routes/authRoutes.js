const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");

// POST /api/auth/register
router.post(
  "/register",
  upload.single("profileImage"),
  authController.register,
);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// POST /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOTP);

// POST /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// GET /api/auth/me  (protected)
router.get("/me", authenticate, authController.getMe);

module.exports = router;
