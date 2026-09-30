import { describe, expect, it, vi } from 'vitest';
import {
  PERMISSIONS,
  ROLES,
  authorize,
  canAssignRole,
  canManageUser,
  getPermissionsForRole,
  hasAllPermissions,
  hasPermission,
  isValidRole,
  requireRoles,
} from '#core/rbac/index.js';

const { MEMBER, ADMIN, SUPER_ADMIN } = ROLES;

describe('RBAC policy', () => {
  it('ma trận quyền theo role', () => {
    expect(hasPermission(MEMBER, PERMISSIONS.PRODUCT_READ)).toBe(true);
    expect(hasPermission(MEMBER, PERMISSIONS.PRODUCT_CREATE)).toBe(false);
    expect(hasPermission(ADMIN, PERMISSIONS.USER_READ)).toBe(true);
    expect(hasPermission(ADMIN, PERMISSIONS.USER_ROLE_UPDATE)).toBe(false);
    expect(hasPermission(SUPER_ADMIN, PERMISSIONS.USER_ROLE_UPDATE)).toBe(true);
    expect(hasPermission(SUPER_ADMIN, 'bat:ky:quyen:nao')).toBe(true);
    expect(hasPermission('hacker', PERMISSIONS.PRODUCT_READ)).toBe(false);
  });

  it('hasAllPermissions yêu cầu đủ tất cả', () => {
    expect(hasAllPermissions(ADMIN, [PERMISSIONS.USER_READ, PERMISSIONS.PRODUCT_CREATE])).toBe(
      true,
    );
    expect(hasAllPermissions(ADMIN, [PERMISSIONS.USER_READ, PERMISSIONS.USER_ROLE_UPDATE])).toBe(
      false,
    );
  });

  it('getPermissionsForRole trả bản sao', () => {
    const permissions = getPermissionsForRole(MEMBER);
    permissions.push('hack');
    expect(getPermissionsForRole(MEMBER)).not.toContain('hack');
    expect(getPermissionsForRole('unknown')).toEqual([]);
  });

  it.each([
    [SUPER_ADMIN, ADMIN, true],
    [SUPER_ADMIN, MEMBER, true],
    [SUPER_ADMIN, SUPER_ADMIN, false],
    [ADMIN, MEMBER, true],
    [ADMIN, ADMIN, false],
    [ADMIN, SUPER_ADMIN, false],
    [MEMBER, MEMBER, false],
  ])('canManageUser(%s -> %s) = %s', (actorRole, targetRole, expected) => {
    expect(canManageUser({ id: 'a', role: actorRole }, { id: 'b', role: targetRole })).toBe(
      expected,
    );
  });

  it('không tự quản lý chính mình', () => {
    expect(canManageUser({ id: 'a', role: SUPER_ADMIN }, { id: 'a', role: MEMBER })).toBe(false);
    expect(canManageUser(null, { id: 'a', role: MEMBER })).toBe(false);
  });

  it('chỉ gán được role thấp hơn mình', () => {
    expect(canAssignRole(SUPER_ADMIN, ADMIN)).toBe(true);
    expect(canAssignRole(SUPER_ADMIN, MEMBER)).toBe(true);
    expect(canAssignRole(SUPER_ADMIN, SUPER_ADMIN)).toBe(false);
    expect(canAssignRole(ADMIN, ADMIN)).toBe(false);
    expect(canAssignRole(SUPER_ADMIN, 'root')).toBe(false);
  });

  it('isValidRole', () => {
    expect(isValidRole(ADMIN)).toBe(true);
    expect(isValidRole('root')).toBe(false);
  });
});

describe('authorize / requireRoles middleware', () => {
  const run = (middleware, user) => {
    const next = vi.fn();
    middleware({ user }, {}, next);
    return next.mock.calls[0][0];
  };

  it('authorize: 401 khi chưa đăng nhập, 403 khi thiếu quyền, next() khi đủ quyền', () => {
    const guard = authorize(PERMISSIONS.PRODUCT_CREATE);
    expect(run(guard, undefined)).toMatchObject({ statusCode: 401 });
    expect(run(guard, { role: MEMBER })).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(run(guard, { role: ADMIN })).toBeUndefined();
  });

  it('requireRoles', () => {
    const guard = requireRoles(SUPER_ADMIN);
    expect(run(guard, undefined)).toMatchObject({ statusCode: 401 });
    expect(run(guard, { role: ADMIN })).toMatchObject({ statusCode: 403 });
    expect(run(guard, { role: SUPER_ADMIN })).toBeUndefined();
  });
});
