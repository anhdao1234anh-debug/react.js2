import { rateLimit } from 'express-rate-limit';
import { env } from '#config/env.js';
import { AppError } from '#core/errors/AppError.js';

/**
 * Factory tạo rate limiter (lưu in-memory).
 * Phase caching: thay store bằng Redis để dùng chung giữa nhiều instance.
 *
 * @param {{ windowMs?: number, limit?: number, message?: string, keyPrefix?: string }} [options]
 */
export function createRateLimiter({
  windowMs = env.RATE_LIMIT_WINDOW_MS,
  limit = env.RATE_LIMIT_MAX,
  message,
} = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(AppError.tooManyRequests(message)),
  });
}

/** Giới hạn chung cho toàn bộ API. */
export const apiRateLimiter = createRateLimiter();

/** Giới hạn chặt cho endpoint nhạy cảm (đăng nhập, gửi mail...). */
export const authRateLimiter = createRateLimiter({
  limit: env.AUTH_RATE_LIMIT_MAX,
  message: 'Bạn đã thử quá nhiều lần, vui lòng đợi vài phút rồi thử lại',
});
