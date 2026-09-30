// Các hàm thuần (pure) kiểm tra quyền - dễ unit test, dùng lại ở middleware & service.
import { ROLE_PERMISSIONS, WILDCARD_PERMISSION } from '#config/permissions.js';
import { ROLE_RANK } from './roles.js';

/** Danh sách permission của một role (trả về mảng rỗng nếu role lạ). */
export function getPermissionsForRole(role) {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

/** Role có permission này không? superAdmin ("*") luôn true. */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(WILDCARD_PERMISSION) || permissions.includes(permission);
}

/** Có đủ TẤT CẢ permission yêu cầu không. */
export function hasAllPermissions(role, permissions) {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getRoleRank(role) {
  return ROLE_RANK[role] ?? 0;
}

/**
 * actor có được quản lý (sửa/xoá/khoá) target không?
 * Quy tắc: chỉ được tác động lên người có cấp THẤP HƠN mình và không tự tác động chính mình
 * qua API quản trị (tránh tự khoá / tự hạ quyền).
 *   - superAdmin quản lý được admin & member
 *   - admin quản lý được member
 *   - member không quản lý được ai
 *
 * @param {{ id: string, role: string }} actor
 * @param {{ id: string, role: string }} target
 */
export function canManageUser(actor, target) {
  if (!actor || !target) return false;
  if (String(actor.id) === String(target.id)) return false;
  return getRoleRank(actor.role) > getRoleRank(target.role);
}

/**
 * actor có được gán role `nextRole` cho người khác không?
 * Chỉ được gán role có cấp THẤP HƠN cấp của mình (superAdmin gán admin/member).
 * => Không thể tạo thêm superAdmin qua API (chỉ qua seed/DB) - chủ đích bảo mật.
 */
export function canAssignRole(actorRole, nextRole) {
  return getRoleRank(actorRole) > getRoleRank(nextRole) && getRoleRank(nextRole) > 0;
}
