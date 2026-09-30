// Ma trận phân quyền (RBAC) của DỰ ÁN.
// - core/rbac chứa CƠ CHẾ (hasPermission, authorize...), file này chứa CHÍNH SÁCH.
// - Thêm module mới => khai báo permission ở PERMISSIONS và gán cho role ở ROLE_PERMISSIONS.
// Quy ước tên: "<resource>:<action>" (vd: product:create).
import { ROLES } from '#core/rbac/roles.js';

export const PERMISSIONS = Object.freeze({
  // Hồ sơ cá nhân
  PROFILE_READ: 'profile:read',
  PROFILE_UPDATE: 'profile:update',

  // Quản lý người dùng
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLE_UPDATE: 'user:role:update',

  // Module mẫu: product
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
});

/** Ký tự đại diện: có mọi quyền. */
export const WILDCARD_PERMISSION = '*';

const MEMBER = [PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_UPDATE, PERMISSIONS.PRODUCT_READ];

const ADMIN = [
  ...MEMBER,
  PERMISSIONS.USER_READ,
  PERMISSIONS.USER_UPDATE,
  PERMISSIONS.USER_DELETE,
  PERMISSIONS.PRODUCT_CREATE,
  PERMISSIONS.PRODUCT_UPDATE,
  PERMISSIONS.PRODUCT_DELETE,
];

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.MEMBER]: Object.freeze(MEMBER),
  [ROLES.ADMIN]: Object.freeze(ADMIN),
  [ROLES.SUPER_ADMIN]: Object.freeze([WILDCARD_PERMISSION]),
});
