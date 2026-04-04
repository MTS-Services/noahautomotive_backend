const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  validateUpdateProfile,
  validateChangePassword,
} = require("../middleware/validate");

// GET /api/users/:id  – public profile (any role)
router.get("/:id", userController.getUserProfile);

// PUT /api/users/profile  – update own profile (User & Vendor)
router.put(
  "/profile",
  authenticate,
  upload.single("profileImage"),
  validateUpdateProfile,
  userController.updateProfile,
);

// PUT /api/users/password  – change password
router.put(
  "/password",
  authenticate,
  validateChangePassword,
  userController.changePassword,
);

module.exports = router;
