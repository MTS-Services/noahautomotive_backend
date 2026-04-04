const adminService = require("../services/adminService");

// ─── Members (Users & Vendors) ────────────────────────────────────────────────

// GET /api/admin/members?role=USER|VENDOR
const getMembers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const result = await adminService.getMembers(role, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/members/:id
const getMemberById = async (req, res, next) => {
  try {
    const member = await adminService.getUserById(req.params.id);
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/members/:id
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

// DELETE /api/admin/members/:id
const deleteMember = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ─── Listing stubs (to be implemented) ───────────────────────────────────────

const getRequestedListings = (_req, res) =>
  res.json({ success: true, message: "TODO: getRequestedListings" });

const getApprovedListings = (_req, res) =>
  res.json({ success: true, message: "TODO: getApprovedListings" });

const getSuspendedListings = (_req, res) =>
  res.json({ success: true, message: "TODO: getSuspendedListings" });

const approveListing = (_req, res) =>
  res.json({ success: true, message: "TODO: approveListing" });

const suspendListing = (_req, res) =>
  res.json({ success: true, message: "TODO: suspendListing" });

const deleteListing = (_req, res) =>
  res.json({ success: true, message: "TODO: deleteListing" });

module.exports = {
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getRequestedListings,
  getApprovedListings,
  getSuspendedListings,
  approveListing,
  suspendListing,
  deleteListing,
};
