const prisma = require("../config/database");
const {
  paginate,
  buildPaginationMeta,
  buildFileUrl,
} = require("../utils/helpers");
const { geocodeAddress, geocodeSearchLocation } = require("./geocodeService");
const sanitizeHtml = require("sanitize-html");

const ALLOWED_HTML = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "a",
  ],
  allowedAttributes: { a: ["href", "target"] },
};

const sanitizeAbout = (value) =>
  value != null ? sanitizeHtml(value, ALLOWED_HTML) : value;

// Attach computed fields to any listing object
const withComputed = (listing) => {
  if (!listing) return listing;
  const daysOnMarket = listing.approvedAt
    ? Math.floor(
        (Date.now() - new Date(listing.approvedAt).getTime()) / 86400000,
      )
    : null;
  const hasPhotos = Array.isArray(listing.images)
    ? listing.images.length > 0
    : false;
  return { ...listing, daysOnMarket, hasPhotos };
};

const LISTING_SELECT = {
  id: true,
  title: true,
  subTitle: true,
  about: true,
  price: true,
  year: true,
  mileage: true,
  fuel: true,
  transmission: true,
  make: true,
  model: true,
  engine: true,
  engineSize: true,
  horsepower: true,
  color: true,
  doors: true,
  seats: true,
  condition: true,
  type: true,
  sellerName: true,
  address: true,
  fuelEconomy: true,
  vehicleHistory: true,
  latitude: true,
  longitude: true,
  status: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  vendor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      bannerImage: true,
      accountType: true,
    },
  },
  images: {
    select: { id: true, url: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  _count: { select: { reviews: true } },
};

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
  seats,
  sortBy,
  sortOrder,
  search,
  location,
  radius,
  type,
  minDays,
  maxDays,
  vehicleHistory,
  color,
  doors,
  minFuelEconomy,
  maxFuelEconomy,
  minEngineSize,
  maxEngineSize,
  withPhotos,
}) => {
  const { skip, take } = paginate(page, limit);

  const where = { status: "APPROVED" };

  if (make) where.make = { contains: make, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (fuel) where.fuel = fuel;
  if (transmission) where.transmission = transmission;
  if (condition) where.condition = condition;
  if (type) where.type = type.toUpperCase();
  if (color) where.color = { equals: color, mode: "insensitive" };
  if (doors) {
    const doorValues = (Array.isArray(doors) ? doors : [doors])
      .map((d) => parseInt(d, 10))
      .filter((d) => !isNaN(d));
    if (doorValues.length === 1) where.doors = doorValues[0];
    else if (doorValues.length > 1) where.doors = { in: doorValues };
  }
  if (vehicleHistory) {
    const items = Array.isArray(vehicleHistory)
      ? vehicleHistory
      : vehicleHistory
          .toString()
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const normalised = items.map((v) => v.toString().toUpperCase());
    // listing must contain ALL selected history values
    where.vehicleHistory = { hasEvery: normalised };
  }

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
  if (minFuelEconomy || maxFuelEconomy) {
    where.fuelEconomy = {};
    if (minFuelEconomy) where.fuelEconomy.gte = parseInt(minFuelEconomy, 10);
    if (maxFuelEconomy) where.fuelEconomy.lte = parseInt(maxFuelEconomy, 10);
  }
  if (minEngineSize || maxEngineSize) {
    where.engineSize = {};
    if (minEngineSize) where.engineSize.gte = parseFloat(minEngineSize);
    if (maxEngineSize) where.engineSize.lte = parseFloat(maxEngineSize);
  }

  if (withPhotos === "true" || withPhotos === true) {
    where.images = { some: {} };
  }
  if (minSeats || maxSeats) {
    where.seats = {};
    if (minSeats) where.seats.gte = parseInt(minSeats, 10);
    if (maxSeats) where.seats.lte = parseInt(maxSeats, 10);
  }
  if (seats) {
    const seatValues = (Array.isArray(seats) ? seats : [seats])
      .map((s) => parseInt(s, 10))
      .filter((s) => !isNaN(s));
    if (seatValues.length === 1) where.seats = seatValues[0];
    else if (seatValues.length > 1) where.seats = { in: seatValues };
  }
  if (minDays || maxDays) {
    const now = Date.now();
    where.approvedAt = { not: null };
    if (maxDays)
      where.approvedAt.gte = new Date(now - parseInt(maxDays, 10) * 86400000);
    if (minDays)
      where.approvedAt.lte = new Date(now - parseInt(minDays, 10) * 86400000);
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

  if (location && radius) {
    const radiusKm = parseFloat(radius);
    if (isNaN(radiusKm) || radiusKm <= 0) {
      const err = new Error("radius must be a positive number (km)");
      err.statusCode = 400;
      throw err;
    }

    const coords = await geocodeSearchLocation(location);
    if (!coords) {
      const err = new Error("Could not geocode the provided location");
      err.statusCode = 400;
      throw err;
    }

    const { latitude: lat, longitude: lng } = coords;

    // Haversine bounding box pre-filter (1 degree ≈ 111 km)
    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
    where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };

    // Fetch with bounding box, then apply exact Haversine filter in JS
    const candidates = await prisma.listing.findMany({
      where,
      select: { ...LISTING_SELECT, latitude: true, longitude: true },
      orderBy: { [orderByField]: orderByDir },
    });

    const R = 6371; // Earth radius in km
    const toRad = (d) => (d * Math.PI) / 180;
    const withinRadius = candidates.filter((l) => {
      if (l.latitude == null || l.longitude == null) return false;
      const dLat = toRad(l.latitude - lat);
      const dLng = toRad(l.longitude - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(l.latitude)) *
          Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= radiusKm;
    });

    const total = withinRadius.length;
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, parseInt(limit, 10));
    const listings = withinRadius.slice((p - 1) * l, p * l).map(withComputed);
    return { listings, pagination: buildPaginationMeta(total, page, limit) };
  }
  // ─────────────────────────────────────────────────────────────────────────
  const [rawListings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: LISTING_SELECT,
      orderBy: { [orderByField]: orderByDir },
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings: rawListings.map(withComputed),
    pagination: buildPaginationMeta(total, page, limit),
  };
};

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

  if (requesterRole === "ADMIN") return withComputed(listing);

  if (requesterRole === "VENDOR" && listing.vendor.id === requesterId)
    return withComputed(listing);

  if (listing.status !== "APPROVED") {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }

  return withComputed(listing);
};

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

const createListing = async (vendorId, data, imageFiles) => {
  const price = parseFloat(data.price);
  if (isNaN(price)) {
    const err = new Error("price must be a valid number");
    err.statusCode = 400;
    throw err;
  }

  const coords = await geocodeAddress(data.address);

  const listing = await prisma.listing.create({
    data: {
      title: data.title,
      subTitle: data.subTitle || null,
      about: sanitizeAbout(data.about),
      price,
      year: parseInt(data.year, 10),
      mileage: parseInt(data.mileage, 10),
      fuel: data.fuel,
      transmission: data.transmission,
      make: data.make,
      model: data.model,
      engine: data.engine,
      engineSize: data.engineSize != null ? parseFloat(data.engineSize) : null,
      horsepower:
        data.horsepower != null ? parseInt(data.horsepower, 10) : null,
      color: data.color,
      doors: parseInt(data.doors, 10),
      seats: parseInt(data.seats, 10),
      condition: data.condition,
      type: data.type || null,
      sellerName: data.sellerName,
      address: data.address,
      fuelEconomy:
        data.fuelEconomy != null ? parseInt(data.fuelEconomy, 10) : null,
      vehicleHistory: Array.isArray(data.vehicleHistory)
        ? data.vehicleHistory
        : data.vehicleHistory
          ? [data.vehicleHistory]
          : [],
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
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
  }

  const updateData = {};
  // Sanitize rich-text about before writing to DB
  if (data.about !== undefined) data.about = sanitizeAbout(data.about);

  const stringFields = [
    "title",
    "subTitle",
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
    "type",
  ];
  stringFields.forEach((f) => {
    if (data[f] !== undefined) updateData[f] = data[f];
  });
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.year !== undefined) updateData.year = parseInt(data.year, 10);
  if (data.mileage !== undefined)
    updateData.mileage = parseInt(data.mileage, 10);
  if (data.horsepower !== undefined)
    updateData.horsepower =
      data.horsepower != null ? parseInt(data.horsepower, 10) : null;
  if (data.doors !== undefined) updateData.doors = parseInt(data.doors, 10);
  if (data.seats !== undefined) updateData.seats = parseInt(data.seats, 10);
  if (data.engineSize !== undefined)
    updateData.engineSize =
      data.engineSize != null ? parseFloat(data.engineSize) : null;
  if (data.fuelEconomy !== undefined)
    updateData.fuelEconomy =
      data.fuelEconomy != null ? parseInt(data.fuelEconomy, 10) : null;
  if (data.vehicleHistory !== undefined)
    updateData.vehicleHistory = Array.isArray(data.vehicleHistory)
      ? data.vehicleHistory
      : data.vehicleHistory
        ? [data.vehicleHistory]
        : [];

  // If address changed, re-geocode
  if (data.address !== undefined) {
    const coords = await geocodeAddress(data.address);
    updateData.latitude = coords?.latitude ?? null;
    updateData.longitude = coords?.longitude ?? null;
  }

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

const setListingStatus = async (id, status) => {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Listing not found");
    err.statusCode = 404;
    throw err;
  }
  const listing = await prisma.listing.update({
    where: { id },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : existing.approvedAt,
    },
    select: LISTING_SELECT,
  });
  return listing;
};

const getVendorDashboard = async (vendorId) => {
  const [
    total,
    active,
    pending,
    rejected,
    suspended,
    totalMessages,
    recentListings,
  ] = await prisma.$transaction([
    prisma.listing.count({ where: { vendorId } }),
    prisma.listing.count({ where: { vendorId, status: "APPROVED" } }),
    prisma.listing.count({ where: { vendorId, status: "PENDING" } }),
    prisma.listing.count({ where: { vendorId, status: "REJECTED" } }),
    prisma.listing.count({ where: { vendorId, status: "SUSPENDED" } }),
    prisma.message.count({ where: { receiverId: vendorId } }),
    // 5 most recent listings
    prisma.listing.findMany({
      where: { vendorId },
      select: {
        id: true,
        title: true,
        price: true,
        make: true,
        model: true,
        year: true,
        status: true,
        createdAt: true,
        images: {
          select: { id: true, url: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    stats: {
      totalListings: total,
      activeListings: active,
      pendingApproval: pending,
      rejectedListings: rejected,
      suspendedListings: suspended,
      totalMessages,
    },
    recentListings,
  };
};

// ─── Makes + Models (for filter dropdowns) ──────────────────────────────────
// Returns every make that has at least 1 APPROVED listing,
// each with its models and per-model count.

const getMakesWithModels = async () => {
  const rows = await prisma.listing.groupBy({
    by: ["make", "model"],
    where: { status: "APPROVED" },
    _count: { _all: true },
    orderBy: [{ make: "asc" }, { model: "asc" }],
  });

  // Group rows into { make → { model → count } }
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.make)) map.set(row.make, { totalCount: 0, models: [] });
    const entry = map.get(row.make);
    entry.totalCount += row._count._all;
    entry.models.push({ name: row.model, count: row._count._all });
  }

  return Array.from(map.entries()).map(([make, data]) => ({
    make,
    totalCount: data.totalCount,
    models: data.models,
  }));
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
  getVendorDashboard,
  getMakesWithModels,
};
