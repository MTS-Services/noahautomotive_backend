const bcrypt = require("bcryptjs");
const prisma = require("../config/database");

const getUserProfile = async (userId) => {
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

const updateProfile = async (
  userId,
  { fullName, phoneNumber, address, postcode, about, profileImage },
) => {
  const data = {};

  if (fullName !== undefined) data.fullName = fullName.toString().trim();
  if (phoneNumber !== undefined) data.phoneNumber = phoneNumber;
  if (address !== undefined) data.address = address;
  if (postcode !== undefined) data.postcode = postcode;
  if (about !== undefined) data.about = about;
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
      postcode: true,
      about: true,
      profileImage: true,
      role: true,
      updatedAt: true,
    },
  });

  return user;
};

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

// Public vendor profile: info + approved listings + avg rating
const getVendorProfile = async (vendorId, { page = 1, limit = 10 }) => {
  const { paginate, buildPaginationMeta } = require("../utils/helpers");
  const { skip, take } = paginate(page, limit);

  const vendor = await prisma.user.findFirst({
    where: { id: vendorId, role: "VENDOR", isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      address: true,
      about: true,
      profileImage: true,
      createdAt: true,
    },
  });

  if (!vendor) {
    const err = new Error("Vendor not found");
    err.statusCode = 404;
    throw err;
  }

  const where = { vendorId, status: "APPROVED" };

  const [listings, total, agg] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        year: true,
        mileage: true,
        fuel: true,
        transmission: true,
        make: true,
        model: true,
        condition: true,
        createdAt: true,
        images: {
          select: { id: true, url: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
    prisma.review.aggregate({
      where: { listing: { vendorId } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    vendor,
    avgRating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 0,
    totalReviews: agg._count.rating,
    listings,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

module.exports = {
  getUserProfile,
  updateProfile,
  changePassword,
  getVendorProfile,
};
