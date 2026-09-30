/**
 * Chuyển chuỗi sort kiểu "-createdAt,price" thành object sort của Mongo,
 * chỉ chấp nhận field nằm trong whitelist (chống sort theo field nhạy cảm/không có index).
 *
 * @example parseSort('-price,title', ['price', 'title']) // { price: -1, title: 1 }
 * @param {string | undefined} input
 * @param {string[]} allowedFields
 * @param {Record<string, 1 | -1>} [fallback]
 */
export function parseSort(input, allowedFields, fallback = { createdAt: -1 }) {
  if (!input) return fallback;
  const sort = {};
  for (const raw of String(input).split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const direction = token.startsWith('-') ? -1 : 1;
    const field = token.replace(/^[-+]/, '');
    if (allowedFields.includes(field)) sort[field] = direction;
  }
  return Object.keys(sort).length > 0 ? sort : fallback;
}

/** Tạo regex cho các sort string hợp lệ - dùng trong Zod schema. */
export function sortPattern(allowedFields) {
  const field = allowedFields.join('|');
  return new RegExp(`^[-+]?(${field})(,[-+]?(${field}))*$`);
}
