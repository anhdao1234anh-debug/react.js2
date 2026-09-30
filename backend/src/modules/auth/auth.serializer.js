import { getPermissionsForRole } from '#core/rbac/policy.js';
/**
 * User trả về cho chính chủ (đăng nhập, /auth/me): kèm danh sách permissions
 * để frontend ẩn/hiện UI mà không phải hard-code ma trận quyền.
 *
 * hasPassword chỉ có khi passwordHash được select (vd login, /auth/me)
 * -> frontend biết user OAuth/magic link chưa đặt mật khẩu.
 */
export function toAuthUser(user) {
  const json = user.toJSON();
  const result = { ...json, permissions: getPermissionsForRole(user.role) };
  if (typeof user.isSelected === 'function' && user.isSelected('passwordHash')) {
    result.hasPassword = Boolean(user.passwordHash);
  }
  return result;
}
