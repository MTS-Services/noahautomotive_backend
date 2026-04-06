const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

// ─── Public ───────────────────────────────────────────────────────────────────
// GET /api/reviews/listing/:listingId   — anyone can read reviews + avg rating
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
