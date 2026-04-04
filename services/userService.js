const bcrypt = require("bcryptjs");
const prisma = require("../config/database");

// ─── Get Public Profile ───────────────────────────────────────────────────────

const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
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

// ─── Update Profile (User & Vendor) ──────────────────────────────────────────

const updateProfile = async (
  userId,
  { fullName, phoneNumber, address, profileImage },
) => {
  const data = {};

  if (fullName !== undefined) data.fullName = fullName.toString().trim();
  if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
  if (address !== undefined) data.address = address;
  if (profileImage !== undefined) data.profileImage = profileImage;

  if (Object.keys(data).length === 0) {
    const err = new Error("No fields provided to update");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
      profileImage: true,
      role: true,
      updatedAt: true,
    },
  });

  return user;
};

// ─── Change Password ──────────────────────────────────────────────────────────

const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    const err = new Error("Current password is incorrect");
    err.statusCode = 401;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};

module.exports = { getUserProfile, updateProfile, changePassword };
