const userService = require("../services/userService");
const { buildFileUrl } = require("../utils/helpers");

const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, address, postcode, about } = req.body;

    // Support both upload.single (legacy) and upload.fields
    const profileFile = req.files?.profileImage?.[0] ?? req.file;
    const bannerFile = req.files?.bannerImage?.[0];

    const profileImage = profileFile
      ? buildFileUrl(profileFile.filename)
      : undefined;

    let bannerImage;
    if (bannerFile) {
      if (req.user.role !== "VENDOR") {
        return res.status(403).json({
          success: false,
          message: "Only vendors can upload a banner image",
        });
      }
      bannerImage = buildFileUrl(bannerFile.filename);
    }

    const user = await userService.updateProfile(req.user.id, {
      fullName,
      phoneNumber,
      address,
      postcode,
      about,
      profileImage,
      bannerImage,
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
