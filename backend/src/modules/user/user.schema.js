import { z } from 'zod';
import { ROLE_LIST } from '#core/rbac/roles.js';
import { idParamsSchema, nameSchema, paginationQuerySchema } from '#core/validation/common.js';

export const USER_SORT_FIELDS = ['createdAt', 'name', 'email', 'role', 'lastLoginAt'];

export const listUsersSchema = {
  query: paginationQuerySchema({
    sortFields: USER_SORT_FIELDS,
    extend: {
      role: z.enum(ROLE_LIST).optional(),
      isActive: z.stringbool().optional(),
    },
  }),
};

export const userIdSchema = { params: idParamsSchema };

/** Người dùng tự cập nhật hồ sơ. */
export const updateProfileSchema = {
  body: z
    .object({
      name: nameSchema.optional(),
      avatarUrl: z.url('URL ảnh không hợp lệ').max(500).or(z.literal('')).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất 1 trường để cập nhật'),
};

/** Admin cập nhật thông tin user khác. */
export const updateUserSchema = {
  params: idParamsSchema,
  body: z
    .object({
      name: nameSchema.optional(),
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất 1 trường để cập nhật'),
};

export const updateRoleSchema = {
  params: idParamsSchema,
  body: z.object({ role: z.enum(ROLE_LIST, { error: 'Role không hợp lệ' }) }).strict(),
};
