const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  return { skip: (p - 1) * l, take: l };
};

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

const buildFileUrl = (filename) => {
  const base = (process.env.BASE_URL || "").replace(/\/$/, "");
  return `${base}/uploads/${filename}`;
};

module.exports = { paginate, buildPaginationMeta, buildFileUrl };
