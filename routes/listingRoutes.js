const express = require("express");
const router = express.Router();
const multer = require("multer");
const listingController = require("../controllers/listingController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { listingUpload } = require("../middleware/upload");
const { validateListing } = require("../middleware/validate");

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", listingController.getListings);
router.get(
  "/dashboard",
  authenticate,
  authorize("VENDOR"),
  listingController.getVendorDashboard,
);
router.get(
  "/my",
  authenticate,
  authorize("VENDOR"),
  listingController.getMyListings,
);
router.get("/:id", optionalAuthenticate, listingController.getListingById);

// Multer error handler — must wrap upload to catch LIMIT_UNEXPECTED_FILE / LIMIT_FILE_COUNT
const withUpload = (handler) => (req, res, next) => {
  listingUpload.array("images", 40)(req, res, (err) => {
    if (
      err instanceof multer.MulterError &&
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message: "Too many images. Maximum 40 images allowed per listing.",
        field: "images",
      });
    }
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) return next(err);
    handler(req, res, next);
  });
};

router.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  withUpload(validateListing),
  listingController.createListing,
);
router.put(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  withUpload(validateListing),
  listingController.updateListing,
);
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  listingController.deleteListingImage,
);
router.delete(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  listingController.deleteListing,
);

module.exports = router;
