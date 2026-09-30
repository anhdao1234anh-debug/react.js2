// Zod schema dùng chung giữa các module.
import { z } from 'zod';
import { PAGINATION } from '#config/constants.js';
import { sortPattern } from '#core/utils/sort.js';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID không hợp lệ');

export const idParamsSchema = z.object({ id: objectIdSchema });

export const emailSchema = z
  .string({ error: 'Email là bắt buộc' })
  .trim()
  .toLowerCase()
  .max(254, 'Email quá dài')
  .pipe(z.email('Email không hợp lệ'));

/** Mật khẩu: 8-128 ký tự, có ít nhất 1 chữ cái và 1 chữ số. */
export const passwordSchema = z
  .string({ error: 'Mật khẩu là bắt buộc' })
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')
  .regex(/[A-Za-z]/, 'Mật khẩu cần ít nhất 1 chữ cái')
  .regex(/\d/, 'Mật khẩu cần ít nhất 1 chữ số');

export const nameSchema = z
  .string({ error: 'Tên là bắt buộc' })
  .trim()
  .min(2, 'Tên tối thiểu 2 ký tự')
  .max(100, 'Tên tối đa 100 ký tự');

/** Token dạng base64url (magic link, reset password...). */
export const tokenSchema = z
  .string({ error: 'Token là bắt buộc' })
  .trim()
  .min(20, 'Token không hợp lệ')
  .max(200, 'Token không hợp lệ');

/**
 * Tạo schema query phân trang + tìm kiếm + sort (whitelist field).
 * @param {{ sortFields?: string[], extend?: import('zod').ZodRawShape }} [options]
 */
export function paginationQuerySchema({ sortFields = ['createdAt'], extend = {} } = {}) {
  return z.object({
    page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(PAGINATION.MAX_LIMIT)
      .default(PAGINATION.DEFAULT_LIMIT),
    search: z.string().trim().max(100).optional(),
    sort: z
      .string()
      .trim()
      .regex(
        sortPattern(sortFields),
        `sort chỉ nhận: ${sortFields.join(', ')} (thêm "-" để giảm dần)`,
      )
      .optional(),
    ...extend,
  });
}
