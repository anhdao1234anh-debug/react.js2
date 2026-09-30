// Zod schema dùng chung phía client. Quy tắc PHẢI khớp backend (backend/src/core/validation/common.js).
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email')
  .max(254, 'Email quá dài')
  .pipe(z.email('Email không hợp lệ'));

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần ít nhất 1 chữ cái')
  .regex(/\d/, 'Mật khẩu cần ít nhất 1 chữ số');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Tên tối thiểu 2 ký tự')
  .max(100, 'Tên tối đa 100 ký tự');

/** URL không bắt buộc: chấp nhận chuỗi rỗng. */
export const optionalUrlSchema = z.union([z.literal(''), z.url('URL không hợp lệ').max(500)]);
