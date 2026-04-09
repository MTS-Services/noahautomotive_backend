const adminService = require("../services/adminService");
const listingService = require("../services/listingService");

const getMembers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const result = await adminService.getMembers(role, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const member = await adminService.getUserById(req.params.id);
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, address, role, isActive, password } =
      req.body;
    const member = await adminService.updateUser(req.params.id, {
      fullName,
      email,
      phoneNumber,
      address,
      role,
      isActive,
      password,
    });
    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

const getListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }
    const result = await listingService.getListingsByStatus(status || null, {
      page,
      limit,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateListingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }
    const listing = await listingService.setListingStatus(
      req.params.id,
      status,
    );
    res.json({
      success: true,
      message: `Listing ${status.toLowerCase()}`,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const result = await listingService.deleteListing(
      req.params.id,
      req.user.id,
      "ADMIN",
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getListings,
  updateListingStatus,
  deleteListing,
};
