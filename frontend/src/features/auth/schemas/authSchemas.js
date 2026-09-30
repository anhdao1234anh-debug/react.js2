import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from '@/core/validation/common';

const confirmPassword =
  (field = 'password') =>
  (data) =>
    data[field] === data.confirmPassword;
const MISMATCH = { path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp' };

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(confirmPassword(), MISMATCH);

export const emailOnlySchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(confirmPassword(), MISMATCH);

/**
 * User chưa có mật khẩu (đăng nhập bằng OAuth/magic link) được đặt mật khẩu mới
 * mà không cần nhập mật khẩu hiện tại.
 */
export function createChangePasswordSchema({ hasPassword }) {
  return z
    .object({
      currentPassword: hasPassword
        ? z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại')
        : z.string().optional(),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine(confirmPassword('newPassword'), MISMATCH)
    .refine((data) => !hasPassword || data.currentPassword !== data.newPassword, {
      path: ['newPassword'],
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    });
}
