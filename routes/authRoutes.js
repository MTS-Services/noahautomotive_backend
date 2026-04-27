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
  validateVerifyEmail,
  validateResendVerification,
} = require("../middleware/validate");

router.post(
  "/register",
  upload.single("profileImage"),
  validateRegister,
  authController.register,
);

router.post("/login", validateLogin, authController.login);

router.post(
  "/forgot-password",
  validateForgotPassword,
  authController.forgotPassword,
);

router.post("/verify-otp", validateVerifyOTP, authController.verifyOTP);

router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post(
  "/resend-verification",
  validateResendVerification,
  authController.resendVerification,
);

router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword,
);

router.get("/me", authenticate, authController.getMe);

router.post("/logout", authenticate, authController.logout);

module.exports = router;
