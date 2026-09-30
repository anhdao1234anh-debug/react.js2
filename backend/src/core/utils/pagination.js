import { PAGINATION } from '#config/constants.js';

/** Chuẩn hoá page/limit từ input bất kỳ (đã qua validate thì chỉ còn clamp). */
export function normalizePagination({ page, limit } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
  const safeLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number.parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT),
  );
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/** Meta phân trang trả về cho client. */
export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
