const listingService = require("../services/listingService");

// ─── Public ───────────────────────────────────────────────────────────────────
const getListings = async (req, res, next) => {
  try {
    // ?view=makes  →  return makes + models + counts instead of listings
    if (req.query.view === "makes") {
      const data = await listingService.getMakesWithModels();
      return res.json({ success: true, data });
    }

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
      minMileage,
      maxMileage,
      minEngine,
      maxEngine,
      minSeats,
      maxSeats,
      seats,
      sortBy,
      sortOrder,
      search,
      location,
      radius,
      type,
      minDays,
      maxDays,
      vehicleHistory,
      color,
      doors,
      minFuelEconomy,
      maxFuelEconomy,
      minEngineSize,
      maxEngineSize,
      withPhotos,
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
      minMileage,
      maxMileage,
      minEngine,
      maxEngine,
      minSeats,
      maxSeats,
      seats,
      sortBy,
      sortOrder,
      search,
      location,
      radius,
      type,
      minDays,
      maxDays,
      vehicleHistory,
      color,
      doors,
      minFuelEconomy,
      maxFuelEconomy,
      minEngineSize,
      maxEngineSize,
      withPhotos,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

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

const createListing = async (req, res, next) => {
  try {
    if (req.files && req.files.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Too many images. Maximum 20 images allowed per listing.",
        field: "images",
      });
    }
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

const getVendorDashboard = async (req, res, next) => {
  try {
    const data = await listingService.getVendorDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/makes
const getMakesWithModels = async (req, res, next) => {
  try {
    const data = await listingService.getMakesWithModels();
    res.json({ success: true, data });
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
  getVendorDashboard,
  getMakesWithModels,
};
