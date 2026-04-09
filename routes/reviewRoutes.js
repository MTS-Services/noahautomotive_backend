const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.get("/listing/:listingId", reviewController.getListingReviews);

router.post("/listing/:listingId", authenticate, reviewController.createReview);
router.put("/:id", authenticate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "VENDOR"),
  reviewController.getReviews,
);

module.exports = router;
