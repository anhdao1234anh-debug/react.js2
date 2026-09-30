import { AppError } from '#core/errors/AppError.js';
import { hasAllPermissions } from './policy.js';

/**
 * Yêu cầu user (đã authenticate) có đủ các permission.
 * Luôn đặt SAU middleware `authenticate`.
 *
 * @example router.post('/', authenticate, authorize(PERMISSIONS.PRODUCT_CREATE), controller.create)
 * @param {...string} permissions
 */
export function authorize(...permissions) {
  return function authorizeMiddleware(req, _res, next) {
    if (!req.user) return next(AppError.unauthorized());
    if (!hasAllPermissions(req.user.role, permissions)) return next(AppError.forbidden());
    return next();
  };
}

/**
 * Yêu cầu user thuộc một trong các role. Ưu tiên dùng `authorize(permission)`
 * (linh hoạt hơn); chỉ dùng requireRoles khi logic thực sự gắn với role.
 * @param {...string} roles
 */
export function requireRoles(...roles) {
  return function requireRolesMiddleware(req, _res, next) {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    return next();
  };
}
