/**
 * Build skip/take values for Prisma pagination.
 * @param {number|string} page  - 1-based page number (default 1)
 * @param {number|string} limit - items per page (default 10)
 */
const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  return { skip: (p - 1) * l, take: l };
};

/**
 * Build pagination meta object for API responses.
 */
const buildPaginationMeta = (total, page, limit) => {
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const totalPages = Math.ceil(total / l);
  return {
    total,
    page: p,
    limit: l,
    totalPages,
    hasNextPage: p < totalPages,
    hasPrevPage: p > 1,
  };
};

module.exports = { paginate, buildPaginationMeta };
