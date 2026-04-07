const authService = require("../services/authService");
const { buildFileUrl } = require("../utils/helpers");

const register = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, password, address, about, role } =
      req.body;
    const profileImage = req.file ? buildFileUrl(req.file.filename) : null;

    const result = await authService.register({
      fullName,
      email,
      phoneNumber,
      password,
      address,
      about,
      profileImage,
      role,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Reset token is required in Authorization header",
      });
    }
    const resetToken = authHeader.split(" ")[1];
    const { newPassword } = req.body;
    const result = await authService.resetPassword(resetToken, newPassword);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
  logout,
};
