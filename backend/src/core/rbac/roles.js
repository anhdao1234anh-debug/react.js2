// 3 role mặc định của source base, xếp theo cấp bậc (rank) tăng dần.
export const ROLES = Object.freeze({
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin',
});

export const ROLE_LIST = Object.freeze(Object.values(ROLES));

/** Cấp bậc: số càng lớn quyền càng cao. Dùng để so sánh "ai được quản lý ai". */
export const ROLE_RANK = Object.freeze({
  [ROLES.MEMBER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
});

export const DEFAULT_ROLE = ROLES.MEMBER;

export const isValidRole = (role) => ROLE_LIST.includes(role);
