import { AppError } from '#core/errors/AppError.js';
import { ErrorCodes } from '#core/errors/errorCodes.js';
import { asyncHandler } from '#core/http/asyncHandler.js';
import { verifyAccessToken } from '#core/security/jwt.js';
import { userRepository } from '#modules/user/user.repository.js';

function extractBearerToken(req) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function resolveUser(token) {
  const payload = verifyAccessToken(token);
  // Luôn đọc user từ DB: role / trạng thái khoá thay đổi có hiệu lực ngay
  // (Phase caching: cache user theo id vài giây để giảm tải DB)
  const user = await userRepository.findById(payload.sub);
  if (!user) throw AppError.unauthorized('Tài khoản không còn tồn tại', ErrorCodes.INVALID_TOKEN);
  if (!user.isActive) throw AppError.forbidden('Tài khoản đã bị khoá', ErrorCodes.ACCOUNT_DISABLED);
  return { user, sessionId: payload.sid };
}

/**
 * Bắt buộc đăng nhập: đọc "Authorization: Bearer <accessToken>", gắn req.user + req.sessionId.
 * req.user là Mongoose document (dùng được .id, .role, .toJSON()).
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw AppError.unauthorized();
  const { user, sessionId } = await resolveUser(token);
  req.user = user;
  req.sessionId = sessionId;
  next();
});

/** Đăng nhập tuỳ chọn: có token hợp lệ thì gắn req.user, không có thì bỏ qua. */
export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  if (token) {
    const { user, sessionId } = await resolveUser(token);
    req.user = user;
    req.sessionId = sessionId;
  }
  next();
});

/** Yêu cầu email đã xác thực (đặt sau authenticate) - dùng cho tính năng nhạy cảm. */
export function requireVerifiedEmail(req, _res, next) {
  if (!req.user?.emailVerifiedAt) {
    return next(AppError.forbidden('Vui lòng xác thực email trước', ErrorCodes.EMAIL_NOT_VERIFIED));
  }
  return next();
}
