// Hash mật khẩu bằng scrypt (built-in node:crypto, được OWASP khuyến nghị) - không cần native addon.
// Định dạng lưu: scrypt$N$r$p$<salt base64>$<hash base64>  -> đổi tham số sau này vẫn verify được hash cũ.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const DEFAULT_PARAMS = Object.freeze({ N: 16384, r: 8, p: 1 });
const MAX_MEMORY = 64 * 1024 * 1024;

/** @param {string} plain */
export async function hashPassword(plain) {
  const { N, r, p } = DEFAULT_PARAMS;
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(plain, salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEMORY });
  return ['scrypt', N, r, p, salt.toString('base64'), derived.toString('base64')].join('$');
}

/**
 * So sánh mật khẩu với hash (constant-time). Trả false nếu hash sai định dạng.
 * @param {string} plain
 * @param {string | null | undefined} stored
 */
export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  const [algorithm, N, r, p, saltB64, hashB64] = stored.split('$');
  if (algorithm !== 'scrypt' || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, 'base64');
  const derived = await scryptAsync(plain, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEMORY,
  });
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

/**
 * Hash giả dùng khi email không tồn tại: vẫn chạy verify để thời gian phản hồi
 * tương đương -> tránh dò email bằng timing attack.
 */
export const DUMMY_PASSWORD_HASH = await hashPassword(randomBytes(16).toString('hex'));
