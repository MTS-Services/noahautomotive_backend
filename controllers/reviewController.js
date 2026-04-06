const reviewService = require("../services/reviewService");

const getListingReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getListingReviews(
      req.params.listingId,
      req.query,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(
      req.params.listingId,
      req.user.id,
      req.body,
    );
    res
      .status(201)
      .json({ success: true, message: "Review submitted", data: review });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.json({ success: true, message: "Review updated", data: review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getReviews(
      req.user.id,
      req.user.role,
      req.query,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListingReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviews,
};
