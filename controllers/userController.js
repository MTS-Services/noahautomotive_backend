const userService = require("../services/userService");
const { buildFileUrl } = require("../utils/helpers");

// GET /api/users/:id  – public seller / user profile
const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile  – update own profile (User & Vendor)
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, address, about } = req.body;
    const profileImage = req.file ? buildFileUrl(req.file.filename) : undefined;

    const user = await userService.updateProfile(req.user.id, {
      fullName,
      phoneNumber,
      address,
      about,
      profileImage,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/password  – change password
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.id, {
      oldPassword,
      newPassword,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/vendors/:id  — public vendor profile + listings
const getVendorProfile = async (req, res, next) => {
  try {
    const result = await userService.getVendorProfile(req.params.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  changePassword,
  getVendorProfile,
};
