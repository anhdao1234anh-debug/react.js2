// Dữ liệu mẫu dùng chung cho test.
export const PERMISSIONS_BY_ROLE = {
  member: ['profile:read', 'profile:update', 'product:read'],
  admin: [
    'profile:read',
    'profile:update',
    'product:read',
    'user:read',
    'user:update',
    'user:delete',
    'product:create',
    'product:update',
    'product:delete',
  ],
  superAdmin: ['*'],
};

export function buildUser(overrides = {}) {
  const role = overrides.role ?? 'member';
  return {
    id: `user-${role}`,
    name: `Test ${role}`,
    email: `${role}@example.com`,
    role,
    isActive: true,
    isEmailVerified: true,
    hasPassword: true,
    permissions: PERMISSIONS_BY_ROLE[role],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildProduct(overrides = {}) {
  return {
    id: 'p1',
    title: 'Bàn phím cơ',
    price: 1_290_000,
    description: 'Switch tactile',
    thumbnail: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

export function pageMeta(total, { page = 1, limit = 12 } = {}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}
