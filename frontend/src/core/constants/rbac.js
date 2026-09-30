// Hằng số RBAC phía client. Tên role/permission PHẢI khớp backend (backend/src/config/permissions.js).
// Quyền thực tế của user lấy từ server (user.permissions) - frontend chỉ dùng để ẩn/hiện UI,
// còn backend mới là nơi chặn truy cập thật sự.

export const ROLES = Object.freeze({
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.MEMBER]: 'Thành viên',
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
});

export const ROLE_RANK = Object.freeze({
  [ROLES.MEMBER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
});

export const PERMISSIONS = Object.freeze({
  PROFILE_READ: 'profile:read',
  PROFILE_UPDATE: 'profile:update',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLE_UPDATE: 'user:role:update',
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
});

/** User có permission không (dựa trên danh sách server trả về, "*" = mọi quyền). */
export function hasPermission(user, permission) {
  const permissions = user?.permissions ?? [];
  return permissions.includes('*') || permissions.includes(permission);
}

/** Cùng quy tắc với backend: chỉ quản lý người có cấp thấp hơn, không tự quản lý mình. */
export function canManageUser(actor, target) {
  if (!actor || !target || actor.id === target.id) return false;
  return (ROLE_RANK[actor.role] ?? 0) > (ROLE_RANK[target.role] ?? 0);
}

/** Các role mà actor được phép gán cho người khác. */
export function getAssignableRoles(actorRole) {
  const rank = ROLE_RANK[actorRole] ?? 0;
  return Object.values(ROLES).filter((role) => ROLE_RANK[role] < rank);
}
