const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const { paginate, buildPaginationMeta } = require("../utils/helpers");

const USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  address: true,
  profileImage: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const getMembers = async (role, page, limit) => {
  const { skip, take } = paginate(page, limit);

  const VALID_ROLES = ["USER", "VENDOR"];
  if (role && !VALID_ROLES.includes(role)) {
    const err = new Error("role must be USER or VENDOR");
    err.statusCode = 400;
    throw err;
  }

  const where = role ? { role } : { role: { in: VALID_ROLES } };

  const [members, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        ...USER_SELECT,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { members, pagination: buildPaginationMeta(total, page, limit) };
};

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      _count: { select: { listings: true } },
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

const updateUser = async (
  id,
  { fullName, email, phoneNumber, address, role, isActive, password },
) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // If email is being changed, ensure it's not taken by another user
  if (email && email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      const err = new Error("Email is already in use by another account");
      err.statusCode = 409;
      throw err;
    }
  }

  const data = {};
  if (fullName !== undefined) data.fullName = fullName.toString().trim();
  if (email !== undefined) data.email = email;
  if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
  if (address !== undefined) data.address = address;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (password !== undefined) data.password = await bcrypt.hash(password, 12);

  if (Object.keys(data).length === 0) {
    const err = new Error("No fields provided to update");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT,
  });

  return user;
};

const deleteUser = async (id) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.user.delete({ where: { id } });
  return { message: "User deleted successfully" };
};

module.exports = { getMembers, getUserById, updateUser, deleteUser };
