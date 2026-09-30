// Access token (JWT, ngắn hạn). Refresh token KHÔNG dùng JWT mà là token ngẫu nhiên lưu hash trong DB
// (xem modules/auth/session.service.js) để có thể thu hồi (revoke) bất kỳ lúc nào.
import jwt from 'jsonwebtoken';
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { parseDuration } from '#core/utils/duration.js';

const ALGORITHM = 'HS256';
const TOKEN_TYPE = 'access';

/** Thời gian sống của access token (giây) - trả về cho client biết để chủ động refresh. */
export const ACCESS_TOKEN_TTL_SECONDS = Math.floor(parseDuration(env.JWT_ACCESS_EXPIRES_IN) / 1000);

/**
 * @param {{ sub: string, role: string, sid?: string }} payload
 *   sub = userId, sid = sessionId (liên kết với refresh session)
 */
export function signAccessToken({ sub, role, sid }) {
  return jwt.sign({ role, sid, typ: TOKEN_TYPE }, env.JWT_ACCESS_SECRET, {
    subject: String(sub),
    algorithm: ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    issuer: env.APP_NAME,
  });
}

/**
 * Xác thực access token. Luôn chỉ định algorithms để chặn tấn công "alg: none"/đổi thuật toán.
 * @returns {{ sub: string, role: string, sid?: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: [ALGORITHM],
      issuer: env.APP_NAME,
    });
    if (payload.typ !== TOKEN_TYPE) throw new jwt.JsonWebTokenError('invalid token type');
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Phiên truy cập đã hết hạn', ErrorCodes.TOKEN_EXPIRED);
    }
    throw AppError.unauthorized('Token không hợp lệ', ErrorCodes.INVALID_TOKEN);
  }
}
