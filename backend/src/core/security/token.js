// Tạo & băm token ngẫu nhiên (refresh token, magic link, reset password...).
// Nguyên tắc: chỉ LƯU HASH trong DB, gửi token gốc cho client -> lộ DB không lộ token.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Token ngẫu nhiên an toàn, dạng base64url (dùng được trong URL). */
export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex của token (token đã đủ entropy nên không cần salt/scrypt). */
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

/** So sánh 2 chuỗi constant-time. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
