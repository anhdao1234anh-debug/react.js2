import { z } from 'zod';
import { OAUTH_PROVIDER_NAMES } from '#core/oauth/providers.js';
import {
  emailSchema,
  nameSchema,
  objectIdSchema,
  passwordSchema,
  tokenSchema,
} from '#core/validation/common.js';

const redirectToSchema = z.string().trim().max(500).optional();

export const registerSchema = {
  body: z.object({ name: nameSchema, email: emailSchema, password: passwordSchema }),
};

export const loginSchema = {
  // Không áp rule độ mạnh khi đăng nhập (chỉ cần có giá trị)
  body: z.object({
    email: emailSchema,
    password: z.string({ error: 'Mật khẩu là bắt buộc' }).min(1, 'Mật khẩu là bắt buộc').max(128),
  }),
};

export const tokenBodySchema = { body: z.object({ token: tokenSchema }) };

export const emailBodySchema = { body: z.object({ email: emailSchema }) };

export const magicLinkRequestSchema = {
  body: z.object({ email: emailSchema, redirectTo: redirectToSchema }),
};

export const resetPasswordSchema = {
  body: z.object({ token: tokenSchema, password: passwordSchema }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().max(128).optional(),
      newPassword: passwordSchema,
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      path: ['newPassword'],
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    }),
};

export const sessionIdSchema = { params: z.object({ id: objectIdSchema }) };

const providerParams = z.object({
  provider: z.enum(OAUTH_PROVIDER_NAMES, { error: 'Provider không được hỗ trợ' }),
});

export const oauthStartSchema = {
  params: providerParams,
  query: z.object({ redirectTo: redirectToSchema }),
};

export const oauthCallbackSchema = {
  params: providerParams,
  query: z.object({
    code: z.string().max(2000).optional(),
    state: z.string().max(500).optional(),
    error: z.string().max(200).optional(),
  }),
};
