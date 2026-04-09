const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { listingUpload } = require("../middleware/upload");

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

router.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  listingUpload.array("images", 10),
  listingController.createListing,
);
router.put(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  listingUpload.array("images", 10),
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
