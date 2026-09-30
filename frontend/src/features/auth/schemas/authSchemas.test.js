import { describe, expect, it } from 'vitest';
import { createChangePasswordSchema, loginSchema, registerSchema } from './authSchemas';

const messages = (result) => result.error.issues.map((issue) => issue.message);

describe('auth schemas', () => {
  it('login: chuẩn hoá email, yêu cầu mật khẩu', () => {
    expect(loginSchema.parse({ email: '  a@b.com ', password: 'x' }).email).toBe('a@b.com');
    expect(messages(loginSchema.safeParse({ email: 'bad', password: '' }))).toEqual([
      'Email không hợp lệ',
      'Vui lòng nhập mật khẩu',
    ]);
  });

  it('register: mật khẩu đủ mạnh và khớp xác nhận', () => {
    const base = {
      name: 'Nguyễn An',
      email: 'a@b.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(messages(registerSchema.safeParse({ ...base, confirmPassword: 'x' }))).toContain(
      'Mật khẩu xác nhận không khớp',
    );
    expect(
      messages(
        registerSchema.safeParse({ ...base, password: 'password', confirmPassword: 'password' }),
      ),
    ).toContain('Mật khẩu cần ít nhất 1 chữ số');
  });

  it('đổi mật khẩu: bắt buộc mật khẩu hiện tại chỉ khi user đã có mật khẩu', () => {
    const values = {
      currentPassword: '',
      newPassword: 'NewPass123',
      confirmPassword: 'NewPass123',
    };
    expect(createChangePasswordSchema({ hasPassword: false }).safeParse(values).success).toBe(true);
    expect(messages(createChangePasswordSchema({ hasPassword: true }).safeParse(values))).toContain(
      'Vui lòng nhập mật khẩu hiện tại',
    );
    expect(
      messages(
        createChangePasswordSchema({ hasPassword: true }).safeParse({
          ...values,
          currentPassword: 'NewPass123',
        }),
      ),
    ).toContain('Mật khẩu mới phải khác mật khẩu hiện tại');
  });
});
