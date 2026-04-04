const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, password, address, role } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await authService.register({
      fullName,
      email,
      phoneNumber,
      password,
      address,
      profileImage,
      role,
    });

    res
      .status(201)
      .json({
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
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
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

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getMe,
};
