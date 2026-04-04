const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
} = require("../middleware/validate");

// POST /api/auth/register
router.post(
  "/register",
  upload.single("profileImage"),
  validateRegister,
  authController.register,
);

// POST /api/auth/login
router.post("/login", validateLogin, authController.login);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.forgotPassword,
);

// POST /api/auth/verify-otp
router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);

// POST /api/auth/reset-password
// Authorization: Bearer <resetToken returned by verify-otp>
// Body: { newPassword, confirmedPassword }
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword,
);

// GET /api/auth/me  (protected)
router.get("/me", authenticate, authController.getMe);

module.exports = router;
