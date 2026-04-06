const prisma = require("../config/database");
const { paginate, buildPaginationMeta } = require("../utils/helpers");

const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, fullName: true, profileImage: true },
  },
};

const notFound = (msg) => {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
};

const getListingReviews = async (listingId, { page = 1, limit = 10 }) => {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) throw notFound("Listing not found");

  const { skip, take } = paginate(page, limit);

  const [reviews, total, agg] = await prisma.$transaction([
    prisma.review.findMany({
      where: { listingId },
      select: REVIEW_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.review.count({ where: { listingId } }),
    prisma.review.aggregate({
      where: { listingId },
      _avg: { rating: true },
    }),
  ]);

  return {
    avgRating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 0,
    totalReviews: total,
    reviews,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

const validateRating = (rating) => {
  const r = parseInt(rating, 10);
  if (isNaN(r) || r < 1 || r > 5) {
    const err = new Error("Rating must be a number between 1 and 5");
    err.statusCode = 400;
    throw err;
  }
  return r;
};

const createReview = async (listingId, authorId, { rating, comment }) => {
  const parsedRating = validateRating(rating);

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true },
  });
  if (!listing) throw notFound("Listing not found or not available for review");

  const existing = await prisma.review.findFirst({
    where: { listingId, authorId },
  });
  if (existing) {
    const err = new Error("You have already reviewed this listing");
    err.statusCode = 409;
    throw err;
  }

  return prisma.review.create({
    data: { rating: parsedRating, comment, listingId, authorId },
    select: REVIEW_SELECT,
  });
};

const updateReview = async (id, authorId, { rating, comment }) => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw notFound("Review not found");

  if (review.authorId !== authorId) {
    const err = new Error("You can only edit your own reviews");
    err.statusCode = 403;
    throw err;
  }

  return prisma.review.update({
    where: { id },
    data: {
      ...(rating !== undefined && { rating: validateRating(rating) }),
      ...(comment !== undefined && { comment }),
    },
    select: REVIEW_SELECT,
  });
};

const deleteReview = async (id, requesterId, requesterRole) => {
  const review = await prisma.review.findUnique({
    where: { id },
    include: { listing: { select: { vendorId: true } } },
  });
  if (!review) throw notFound("Review not found");

  const isOwner = review.authorId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  const isVendor =
    requesterRole === "VENDOR" && review.listing.vendorId === requesterId;

  if (!isOwner && !isAdmin && !isVendor) {
    const err = new Error("You do not have permission to delete this review");
    err.statusCode = 403;
    throw err;
  }

  await prisma.review.delete({ where: { id } });
  return { message: "Review deleted successfully" };
};

const getReviews = async (
  requesterId,
  requesterRole,
  { listingId, page = 1, limit = 10 },
) => {
  const { skip, take } = paginate(page, limit);

  let where = {};

  if (requesterRole === "ADMIN") {
    if (listingId) where.listingId = listingId;
  } else if (requesterRole === "VENDOR") {
    where.listing = { vendorId: requesterId };
    if (listingId) {
      // verify this listing belongs to the vendor
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, vendorId: requesterId },
        select: { id: true },
      });
      if (!listing)
        throw notFound("Listing not found or does not belong to you");
      where = { listingId, listing: { vendorId: requesterId } };
    }
  }

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where,
      select: {
        ...REVIEW_SELECT,
        listing: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return { reviews, pagination: buildPaginationMeta(total, page, limit) };
};

module.exports = {
  getListingReviews,
  createReview,
  updateReview,
  deleteReview,
  getReviews,
};
