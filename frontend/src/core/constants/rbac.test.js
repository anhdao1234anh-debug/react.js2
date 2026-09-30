import { describe, expect, it } from 'vitest';
import { canManageUser, getAssignableRoles, hasPermission, ROLES } from './rbac';

describe('rbac (client)', () => {
  it('hasPermission dựa vào user.permissions từ server', () => {
    expect(hasPermission({ permissions: ['product:read'] }, 'product:read')).toBe(true);
    expect(hasPermission({ permissions: ['product:read'] }, 'user:read')).toBe(false);
    expect(hasPermission({ permissions: ['*'] }, 'anything')).toBe(true);
    expect(hasPermission(null, 'product:read')).toBe(false);
  });

  it('canManageUser: chỉ quản lý cấp thấp hơn, không tự quản lý mình', () => {
    const admin = { id: 'a', role: ROLES.ADMIN };
    expect(canManageUser(admin, { id: 'b', role: ROLES.MEMBER })).toBe(true);
    expect(canManageUser(admin, { id: 'c', role: ROLES.ADMIN })).toBe(false);
    expect(canManageUser(admin, { id: 'a', role: ROLES.MEMBER })).toBe(false);
    expect(canManageUser(null, { id: 'b', role: ROLES.MEMBER })).toBe(false);
  });

  it('getAssignableRoles', () => {
    expect(getAssignableRoles(ROLES.SUPER_ADMIN)).toEqual([ROLES.MEMBER, ROLES.ADMIN]);
    expect(getAssignableRoles(ROLES.ADMIN)).toEqual([ROLES.MEMBER]);
    expect(getAssignableRoles(undefined)).toEqual([]);
  });
});
