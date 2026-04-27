const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  validateUpdateProfile,
  validateChangePassword,
} = require("../middleware/validate");

router.get("/vendors/:id", userController.getVendorProfile);
router.get("/:id", userController.getUserProfile);

router.put(
  "/profile",
  authenticate,
  upload.single("profileImage"),
  validateUpdateProfile,
  userController.updateProfile,
);

router.put(
  "/password",
  authenticate,
  validateChangePassword,
  userController.changePassword,
);

module.exports = router;
