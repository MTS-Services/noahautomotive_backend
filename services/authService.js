const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");
const { sendOTPEmail } = require("./emailService");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const generateOTP = () => Math.floor(10000 + Math.random() * 90000).toString();

const generateResetToken = (email) =>
  jwt.sign({ email, type: "reset" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const register = async ({
  fullName,
  email,
  phoneNumber,
  password,
  address,
  about,
  profileImage,
  role,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email is already registered");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address,
      about,
      profileImage,
      role: role || "USER",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
      about: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken(user.id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is deactivated. Please contact support.");
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user.id);
  const { password: _pw, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("No account found with this email");
    err.statusCode = 404;
    throw err;
  }

  // Invalidate any previous unused OTPs
  await prisma.otpVerification.updateMany({
    where: { email, isUsed: false },
    data: { isUsed: true },
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpVerification.create({
    data: { email, otp, expiresAt },
  });

  await sendOTPEmail(email, otp, user.fullName);

  return { message: "OTP sent to your email address" };
};

const verifyOTP = async (email, otp) => {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      otp,
      isUsed: false,
      isVerified: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    const err = new Error("Invalid or expired OTP");
    err.statusCode = 400;
    throw err;
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: {
      isVerified: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const resetToken = generateResetToken(email);
  return { resetToken };
};

const resetPassword = async (resetToken, newPassword) => {
  let email;
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (!decoded.email || decoded.type !== "reset") {
      const err = new Error("Invalid reset token");
      err.statusCode = 400;
      throw err;
    }
    email = decoded.email;
  } catch (err) {
    if (!err.statusCode) {
      err.message = "Invalid or expired reset token";
      err.statusCode = 400;
    }
    throw err;
  }

  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      isVerified: true,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    const err = new Error(
      "OTP verification required or session expired. Please request a new OTP.",
    );
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    }),
    prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true },
    }),
  ]);

  return { message: "Password reset successfully" };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
      about: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
};
