const UNIT_MS = Object.freeze({
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
});

/**
 * Chuyển chuỗi thời lượng thành mili-giây.
 * @example parseDuration('15m') // 900000
 * @param {string | number} input
 */
export function parseDuration(input) {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  const match = /^(\d+)(ms|s|m|h|d|w)$/.exec(String(input).trim());
  if (!match) throw new Error(`Thời lượng không hợp lệ: "${input}" (vd hợp lệ: 30s, 15m, 7d)`);
  return Number(match[1]) * UNIT_MS[match[2]];
}

/** Date tương lai sau một khoảng thời lượng tính từ `from`. */
export function addDuration(input, from = new Date()) {
  return new Date(from.getTime() + parseDuration(input));
}
