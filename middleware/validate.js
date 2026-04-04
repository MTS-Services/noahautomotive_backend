const { validateEmail, validatePassword } = require("../utils/validators");

// ─── Reusable helper ──────────────────────────────────────────────────────────
const fail = (res, message, field) =>
  res.status(400).json({ success: false, message, ...(field && { field }) });

// ─── Auth validators ──────────────────────────────────────────────────────────

const validateRegister = (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !fullName.toString().trim()) {
    return fail(res, "Full name is required", "fullName");
  }
  if (!email || !validateEmail(email)) {
    return fail(res, "A valid email address is required", "email");
  }
  if (!password || !validatePassword(password)) {
    return fail(res, "Password must be at least 6 characters", "password");
  }
  if (role && !["USER", "VENDOR", "ADMIN"].includes(role)) {
    return fail(res, "Role must be USER, VENDOR or ADMIN", "role");
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return fail(res, "A valid email address is required", "email");
  }
  if (!password || typeof password !== "string" || !password.trim()) {
    return fail(res, "Password is required", "password");
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return fail(res, "A valid email address is required", "email");
  }

  next();
};

const validateVerifyOTP = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !validateEmail(email)) {
    return fail(res, "A valid email address is required", "email");
  }
  if (!otp || !/^\d{6}$/.test(otp.toString())) {
    return fail(res, "OTP must be a 6-digit number", "otp");
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { newPassword, confirmedPassword } = req.body;

  if (!newPassword || !validatePassword(newPassword)) {
    return fail(
      res,
      "New password must be at least 6 characters",
      "newPassword",
    );
  }
  if (!confirmedPassword) {
    return fail(res, "Confirmed password is required", "confirmedPassword");
  }
  if (newPassword !== confirmedPassword) {
    return fail(res, "Passwords do not match", "confirmedPassword");
  }

  next();
};

// ─── Profile update validators ────────────────────────────────────────────────

const validateUpdateProfile = (req, res, next) => {
  const { email, phoneNumber } = req.body;

  if (email !== undefined && !validateEmail(email)) {
    return fail(res, "A valid email address is required", "email");
  }
  if (
    phoneNumber !== undefined &&
    phoneNumber &&
    !/^\+?[\d\s\-().]{7,20}$/.test(phoneNumber)
  ) {
    return fail(res, "Invalid phone number format", "phoneNumber");
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { oldPassword, newPassword, confirmedPassword } = req.body;

  if (!oldPassword || typeof oldPassword !== "string" || !oldPassword.trim()) {
    return fail(res, "Current password is required", "oldPassword");
  }
  if (!newPassword || !validatePassword(newPassword)) {
    return fail(
      res,
      "New password must be at least 6 characters",
      "newPassword",
    );
  }
  if (!confirmedPassword) {
    return fail(res, "Confirmed password is required", "confirmedPassword");
  }
  if (newPassword !== confirmedPassword) {
    return fail(res, "Passwords do not match", "confirmedPassword");
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
  validateUpdateProfile,
  validateChangePassword,
};
