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
  postcode,
  about,
  profileImage,
  role,
  accountType,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isEmailVerified) {
      // Resend OTP so they can complete verification
      await prisma.otpVerification.updateMany({
        where: { email, isUsed: false, purpose: "EMAIL_VERIFICATION" },
        data: { isUsed: true },
      });
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 60 * 1000);
      await prisma.otpVerification.create({
        data: { email, otp, expiresAt, purpose: "EMAIL_VERIFICATION" },
      });
      await sendOTPEmail(email, otp, existing.fullName);

      const err = new Error(
        "Email registered but not verified. A new verification code has been sent to your email.",
      );
      err.statusCode = 409;
      err.code = "EMAIL_NOT_VERIFIED";
      err.email = email;
      throw err;
    }
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
      postcode,
      about,
      profileImage,
      role: role || "USER",
      accountType: role === "VENDOR" ? accountType : null,
      isEmailVerified: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  });

  // Invalidate previous OTPs and send a fresh one
  await prisma.otpVerification.updateMany({
    where: { email, isUsed: false, purpose: "EMAIL_VERIFICATION" },
    data: { isUsed: true },
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 60 * 1000);

  await prisma.otpVerification.create({
    data: { email, otp, expiresAt, purpose: "EMAIL_VERIFICATION" },
  });

  await sendOTPEmail(email, otp, user.fullName);

  return {
    message:
      "Registration successful. Please check your email for the verification code.",
    email: user.email,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isEmailVerified) {
    const err = new Error(
      "Please verify your email address before logging in.",
    );
    err.statusCode = 403;
    err.code = "EMAIL_NOT_VERIFIED";
    err.email = user.email;
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
      postcode: true,
      about: true,
      profileImage: true,
      bannerImage: true,
      role: true,
      accountType: true,
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

const verifyEmailOTP = async (email, otp) => {
  const record = await prisma.otpVerification.findFirst({
    where: {
      email,
      otp,
      isUsed: false,
      isVerified: false,
      purpose: "EMAIL_VERIFICATION",
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    const err = new Error("Invalid or expired verification code");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Account not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
    }),
    prisma.otpVerification.update({
      where: { id: record.id },
      data: { isUsed: true, isVerified: true },
    }),
  ]);

  const { password: _pw, ...userWithoutPassword } = user;
  const token = generateToken(user.id);
  return {
    message: "Email verified successfully.",
    user: { ...userWithoutPassword, isEmailVerified: true },
    token,
  };
};

const resendVerificationOTP = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("No account found with this email");
    err.statusCode = 404;
    throw err;
  }
  if (user.isEmailVerified) {
    const err = new Error("Email is already verified");
    err.statusCode = 400;
    throw err;
  }

  await prisma.otpVerification.updateMany({
    where: { email, isUsed: false, purpose: "EMAIL_VERIFICATION" },
    data: { isUsed: true },
  });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 60 * 1000);

  await prisma.otpVerification.create({
    data: { email, otp, expiresAt, purpose: "EMAIL_VERIFICATION" },
  });

  await sendOTPEmail(email, otp, user.fullName);

  return { message: "Verification code resent to your email address" };
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getProfile,
  verifyEmailOTP,
  resendVerificationOTP,
};
