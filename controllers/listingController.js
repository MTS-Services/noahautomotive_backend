const listingService = require("../services/listingService");

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/listings
const getListings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      make,
      model,
      fuel,
      transmission,
      condition,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      search,
    } = req.query;
    const result = await listingService.getListings({
      page,
      limit,
      make,
      model,
      fuel,
      transmission,
      condition,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      search,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/:id
const getListingById = async (req, res, next) => {
  try {
    const listing = await listingService.getListingById(
      req.params.id,
      req.user?.id ?? null,
      req.user?.role ?? null,
    );
    res.json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
};

// ─── Vendor ───────────────────────────────────────────────────────────────────

// GET /api/listings/my
const getMyListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await listingService.getMyListings(req.user.id, {
      page,
      limit,
      status,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/listings
const createListing = async (req, res, next) => {
  try {
    const listing = await listingService.createListing(
      req.user.id,
      req.body,
      req.files,
    );
    res.status(201).json({
      success: true,
      message: "Listing created and submitted for review",
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/listings/:id
const updateListing = async (req, res, next) => {
  try {
    const listing = await listingService.updateListing(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body,
      req.files,
    );
    res.json({
      success: true,
      message: "Listing updated successfully",
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/listings/:id/images/:imageId
const deleteListingImage = async (req, res, next) => {
  try {
    const result = await listingService.deleteListingImage(
      req.params.id,
      req.params.imageId,
      req.user.id,
      req.user.role,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/listings/:id
const deleteListing = async (req, res, next) => {
  try {
    const result = await listingService.deleteListing(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListingImage,
  deleteListing,
};
