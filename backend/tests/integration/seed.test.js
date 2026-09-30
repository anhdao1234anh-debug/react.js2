import { describe, expect, it } from 'vitest';
import { verifyPassword } from '#core/security/password.js';
import { Product } from '#modules/product/product.model.js';
import { User } from '#modules/user/user.model.js';
import { createUser } from '#tests/helpers.js';
import { seedSampleProducts, seedSuperAdmin } from '../../src/scripts/seeders.js';

const input = { name: 'Root', email: 'root@example.com', password: 'RootPass123' };

describe('seeders', () => {
  it('tạo superAdmin lần đầu, lần sau không đổi (idempotent)', async () => {
    const first = await seedSuperAdmin(input);
    expect(first.action).toBe('created');
    expect(first.user).toMatchObject({ role: 'superAdmin', email: 'root@example.com' });
    expect(first.user.emailVerifiedAt).toBeInstanceOf(Date);

    const second = await seedSuperAdmin(input);
    expect(second.action).toBe('unchanged');
    expect(await User.countDocuments()).toBe(1);
  });

  it('nâng quyền + mở khoá user có sẵn, reset mật khẩu khi yêu cầu', async () => {
    await createUser({ email: 'root@example.com', role: 'member', isActive: false });
    const result = await seedSuperAdmin({ ...input, resetPassword: true });
    expect(result.action).toBe('updated');

    const user = await User.findOne({ email: 'root@example.com' }).select('+passwordHash');
    expect(user).toMatchObject({ role: 'superAdmin', isActive: true });
    expect(await verifyPassword('RootPass123', user.passwordHash)).toBe(true);
  });

  it('báo lỗi khi thiếu env hoặc mật khẩu yếu', async () => {
    await expect(seedSuperAdmin({ name: 'x' })).rejects.toThrow(/SUPER_ADMIN_EMAIL/);
    await expect(seedSuperAdmin({ ...input, password: 'weak' })).rejects.toThrow(/chưa đủ mạnh/);
  });

  it('thêm sản phẩm mẫu chỉ khi collection trống', async () => {
    const { user } = await seedSuperAdmin(input);
    expect(await seedSampleProducts(user)).toBe(5);
    expect(await seedSampleProducts(user)).toBe(0);
    expect(await Product.countDocuments({ createdBy: user._id })).toBe(5);
  });
});
