const prisma = require("../config/database");
const {
  paginate,
  buildPaginationMeta,
  buildFileUrl,
} = require("../utils/helpers");

// ─── Shared select shape ──────────────────────────────────────────────────────

const LISTING_SELECT = {
  id: true,
  title: true,
  about: true,
  price: true,
  year: true,
  mileage: true,
  fuel: true,
  transmission: true,
  make: true,
  model: true,
  engine: true,
  horsepower: true,
  color: true,
  doors: true,
  seats: true,
  condition: true,
  sellerName: true,
  address: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  vendor: {
    select: { id: true, fullName: true, email: true, profileImage: true },
  },
  images: { select: { id: true, url: true }, orderBy: { createdAt: "asc" } },
  _count: { select: { reviews: true } },
};

// ─── Browse / Filter (public — APPROVED only) ────────────────────────────────

const getListings = async ({
  page,
  limit,
  make,
  model,
  fuel,
  transmission,
  condition,
  minPrice,
  maxPrice,
  minYear,
  maxYear,
  minMileage,
  maxMileage,
  minEngine,
  maxEngine,
  minSeats,
  maxSeats,
  sortBy,
  sortOrder,
  search,
}) => {
  const { skip, take } = paginate(page, limit);

  const where = { status: "APPROVED" };

  if (make) where.make = { contains: make, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (fuel) where.fuel = fuel;
  if (transmission) where.transmission = transmission;
  if (condition) where.condition = condition;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  if (minYear || maxYear) {
    where.year = {};
    if (minYear) where.year.gte = parseInt(minYear, 10);
    if (maxYear) where.year.lte = parseInt(maxYear, 10);
  }
  if (minMileage || maxMileage) {
    where.mileage = {};
    if (minMileage) where.mileage.gte = parseInt(minMileage, 10);
    if (maxMileage) where.mileage.lte = parseInt(maxMileage, 10);
  }
  if (minEngine || maxEngine) {
    where.horsepower = {};
    if (minEngine) where.horsepower.gte = parseInt(minEngine, 10);
    if (maxEngine) where.horsepower.lte = parseInt(maxEngine, 10);
  }
  if (minSeats || maxSeats) {
    where.seats = {};
    if (minSeats) where.seats.gte = parseInt(minSeats, 10);
    if (maxSeats) where.seats.lte = parseInt(maxSeats, 10);
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { about: { contains: search, mode: "insensitive" } },
    ];
  }

  const SORT_FIELDS = ["price", "year", "mileage", "createdAt"];
  const orderByField = SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const orderByDir = sortOrder === "asc" ? "asc" : "desc";

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: LISTING_SELECT,
      orderBy: { [orderByField]: orderByDir },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Single listing detail ───────────────────────────────────────────────────
// Public/USER: APPROVED only
// VENDOR: own listing any status
// ADMIN: any listing any status

const getListingById = async (id, requesterId = null, requesterRole = null) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: LISTING_SELECT,
  });

  if (!listing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }

  // ADMIN can see any listing
  if (requesterRole === "ADMIN") return listing;

  // VENDOR can see their own listing regardless of status
  if (requesterRole === "VENDOR" && listing.vendor.id === requesterId)
    return listing;

  // Everyone else: APPROVED only
  if (listing.status !== "APPROVED") {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }

  return listing;
};

// ─── Vendor: get own listings (all statuses, filterable) ─────────────────────

const getMyListings = async (vendorId, { page, limit, status }) => {
  const { skip, take } = paginate(page, limit);

  const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];
  const where = { vendorId };
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(
        `status must be one of: ${VALID_STATUSES.join(", ")}`,
      );
      err.statusCode = 400;
      throw err;
    }
    where.status = status;
  }

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: LISTING_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Create listing (VENDOR) ──────────────────────────────────────────────────

const createListing = async (vendorId, data, imageFiles) => {
  const price = parseFloat(data.price);
  if (isNaN(price)) {
    const err = new Error("price must be a valid number");
    err.statusCode = 400;
    throw err;
  }

  const listing = await prisma.listing.create({
    data: {
      title: data.title,
      about: data.about,
      price,
      year: parseInt(data.year, 10),
      mileage: parseInt(data.mileage, 10),
      fuel: data.fuel,
      transmission: data.transmission,
      make: data.make,
      model: data.model,
      engine: data.engine,
      horsepower: parseInt(data.horsepower, 10),
      color: data.color,
      doors: parseInt(data.doors, 10),
      seats: parseInt(data.seats, 10),
      condition: data.condition,
      sellerName: data.sellerName,
      address: data.address,
      vendor: { connect: { id: vendorId } },
      images: imageFiles?.length
        ? {
            create: imageFiles.map((f) => ({
              url: buildFileUrl(`listings/${f.filename}`),
            })),
          }
        : undefined,
    },
    select: LISTING_SELECT,
  });
  return listing;
};

// ─── Update listing (VENDOR owns it, or ADMIN) ───────────────────────────────

const updateListing = async (
  id,
  requesterId,
  requesterRole,
  data,
  imageFiles,
) => {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }

  if (requesterRole === "VENDOR") {
    if (existing.vendorId !== requesterId) {
      const err = new Error("You can only edit your own listings");
      err.statusCode = 403;
      throw err;
    }
    if (!["PENDING", "REJECTED"].includes(existing.status)) {
      const err = new Error(
        "You can only edit listings that are PENDING or REJECTED",
      );
      err.statusCode = 403;
      throw err;
    }
  }

  const updateData = {};
  const stringFields = [
    "title",
    "about",
    "sellerName",
    "address",
    "make",
    "model",
    "engine",
    "color",
    "fuel",
    "transmission",
    "condition",
  ];
  stringFields.forEach((f) => {
    if (data[f] !== undefined) updateData[f] = data[f];
  });
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.year !== undefined) updateData.year = parseInt(data.year, 10);
  if (data.mileage !== undefined)
    updateData.mileage = parseInt(data.mileage, 10);
  if (data.horsepower !== undefined)
    updateData.horsepower = parseInt(data.horsepower, 10);
  if (data.doors !== undefined) updateData.doors = parseInt(data.doors, 10);
  if (data.seats !== undefined) updateData.seats = parseInt(data.seats, 10);

  // Vendor re-submitting a rejected listing resets it to PENDING for re-review
  if (requesterRole === "VENDOR" && existing.status === "REJECTED") {
    updateData.status = "PENDING";
  }

  if (imageFiles?.length) {
    updateData.images = {
      create: imageFiles.map((f) => ({
        url: buildFileUrl(`listings/${f.filename}`),
      })),
    };
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: updateData,
    select: LISTING_SELECT,
  });
  return listing;
};

// ─── Delete a single listing image ───────────────────────────────────────────

const deleteListingImage = async (
  listingId,
  imageId,
  requesterId,
  requesterRole,
) => {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }
  if (requesterRole === "VENDOR" && listing.vendorId !== requesterId) {
    const err = new Error("You can only manage your own listings");
    err.statusCode = 403;
    throw err;
  }
  const image = await prisma.listingImage.findFirst({
    where: { id: imageId, listingId },
  });
  if (!image) {
    const err = new Error("Image not found");
    err.statusCode = 404;
    throw err;
  }
  await prisma.listingImage.delete({ where: { id: imageId } });
  return { message: "Image deleted" };
};

// ─── Delete listing (VENDOR owns, or ADMIN) ───────────────────────────────────

const deleteListing = async (id, requesterId, requesterRole) => {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }
  if (requesterRole === "VENDOR" && existing.vendorId !== requesterId) {
    const err = new Error("You can only delete your own listings");
    err.statusCode = 403;
    throw err;
  }
  await prisma.listing.delete({ where: { id } });
  return { message: "Listing deleted successfully" };
};

// ─── Admin: get listings by status ────────────────────────────────────────────

const getListingsByStatus = async (status, { page, limit }) => {
  const { skip, take } = paginate(page, limit);
  const where = status ? { status } : {};

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: LISTING_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, pagination: buildPaginationMeta(total, page, limit) };
};

// ─── Admin: change listing status ────────────────────────────────────────────

const setListingStatus = async (id, status) => {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }
  const listing = await prisma.listing.update({
    where: { id },
    data: { status },
    select: LISTING_SELECT,
  });
  return listing;
};

module.exports = {
  getListings,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListingImage,
  deleteListing,
  getListingsByStatus,
  setListingStatus,
};
