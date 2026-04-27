const { validateEmail, validatePassword } = require("../utils/validators");

// ─── Reusable helper ──────────────────────────────────────────────────────────
const fail = (res, message, field) =>
  res.status(400).json({ success: false, message, ...(field && { field }) });

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
  if (!otp || !/^\d{5}$/.test(otp.toString())) {
    return fail(res, "OTP must be a 5-digit number", "otp");
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

const VALID_COLORS = [
  "Black",
  "Blue",
  "Brown",
  "Gold",
  "Green",
  "Grey",
  "Orange",
  "Pink",
  "Purple",
  "Red",
  "Silver",
  "Teal",
  "White",
  "Yellow",
  "Unknown",
];

// Engine sizes in litres (0.6 to 7.0 in 0.1 steps)
const VALID_ENGINE_SIZES = [
  0.6, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2,
  2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0, 3.2, 3.5, 3.7, 3.9, 4.0, 4.2, 4.4,
  4.7, 5.0, 5.2, 5.5, 6.0, 6.2, 6.5, 7.0,
];

// Valid vehicle history enum values
const VALID_VEHICLE_HISTORY = [
  "NO_ACCIDENTS_REPORTED",
  "NO_THEFT_HISTORY_REPORTED",
  "NO_VEHICLE_DAMAGE_REPORTED",
];

const VALID_VEHICLE_TYPES = [
  "SUV",
  "SEDAN",
  "HATCHBACK",
  "HYBRID",
  "CONVERTIBLE",
];

const validateListing = (req, res, next) => {
  const { color, engineSize, fuelEconomy, vehicleHistory, type } = req.body;

  // ── Vehicle type ───────────────────────────────────────────────────────────
  if (type !== undefined && type !== null && type !== "") {
    if (!VALID_VEHICLE_TYPES.includes(type.toString().toUpperCase())) {
      return fail(
        res,
        `type must be one of: ${VALID_VEHICLE_TYPES.join(", ")}`,
        "type",
      );
    }
    req.body.type = type.toString().toUpperCase();
  }

  // ── Color ──────────────────────────────────────────────────────────────────
  if (color !== undefined) {
    const normalised = color.toString().trim();
    const matched = VALID_COLORS.find(
      (c) => c.toLowerCase() === normalised.toLowerCase(),
    );
    if (!matched) {
      return fail(
        res,
        `color must be one of: ${VALID_COLORS.join(", ")}`,
        "color",
      );
    }
    req.body.color = matched;
  }

  // ── Engine size ────────────────────────────────────────────────────────────
  if (engineSize !== undefined && engineSize !== null && engineSize !== "") {
    const es = parseFloat(engineSize);
    if (isNaN(es) || !VALID_ENGINE_SIZES.includes(es)) {
      return fail(
        res,
        `engineSize must be one of: ${VALID_ENGINE_SIZES.join(", ")} (litres)`,
        "engineSize",
      );
    }
  }

  // ── Fuel economy ───────────────────────────────────────────────────────────
  if (fuelEconomy !== undefined && fuelEconomy !== null && fuelEconomy !== "") {
    const mpg = parseInt(fuelEconomy, 10);
    if (isNaN(mpg) || mpg < 4 || mpg > 50) {
      return fail(
        res,
        "fuelEconomy must be between 4 and 50 (mpg)",
        "fuelEconomy",
      );
    }
  }

  // ── Vehicle history ────────────────────────────────────────────────────────
  if (
    vehicleHistory !== undefined &&
    vehicleHistory !== null &&
    vehicleHistory !== ""
  ) {
    // Support array (multiple form-data rows), comma-separated string, or single value
    const raw = Array.isArray(vehicleHistory)
      ? vehicleHistory
      : [vehicleHistory];
    const items = raw.flatMap((v) =>
      v
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    for (const item of items) {
      if (!VALID_VEHICLE_HISTORY.includes(item.toString().toUpperCase())) {
        return fail(
          res,
          `vehicleHistory values must be one of: ${VALID_VEHICLE_HISTORY.join(", ")}`,
          "vehicleHistory",
        );
      }
    }
    req.body.vehicleHistory = items.map((i) => i.toString().toUpperCase());
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
  validateListing,
  validateVerifyEmail: (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !validateEmail(email))
      return fail(res, "A valid email address is required", "email");
    if (!otp || !/^\d{5}$/.test(otp.toString()))
      return fail(res, "OTP must be a 5-digit number", "otp");
    next();
  },
  validateResendVerification: (req, res, next) => {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return fail(res, "A valid email address is required", "email");
    next();
  },
};
