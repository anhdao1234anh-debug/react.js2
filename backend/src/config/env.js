// Nạp & validate biến môi trường bằng Zod (fail-fast).
// - Không đọc process.env ở nơi khác: luôn import { env } từ file này.
// - Thêm biến mới => cập nhật envSchema + .env.example (test env.test.js sẽ báo nếu lệch).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ENV_FILE = path.join(BACKEND_ROOT, '.env');

// Test tự cung cấp env (vitest.config.js) để không phụ thuộc file .env cục bộ
if (process.env.NODE_ENV !== 'test' && existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const DURATION_REGEX = /^\d+(ms|s|m|h|d|w)$/;

const duration = (fallback) =>
  z
    .string()
    .trim()
    .regex(DURATION_REGEX, 'Định dạng thời lượng phải như 15m, 1h, 7d')
    .default(fallback);

// Chuỗi rỗng trong .env ("KEY=") được coi như không khai báo
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const csv = (fallback) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );

export const envSchema = z
  .object({
    // ----- App -----
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    APP_NAME: z.string().trim().min(1).default('Source Base'),
    API_PUBLIC_URL: z.url().default('http://localhost:8000'),
    FRONTEND_URL: z.url().default('http://localhost:5173'),
    CORS_ORIGINS: csv('http://localhost:5173'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    // ----- Database -----
    MONGODB_URI: z
      .string()
      .trim()
      .regex(
        /^mongodb(\+srv)?:\/\//,
        'MONGODB_URI phải bắt đầu bằng mongodb:// hoặc mongodb+srv://',
      ),

    // ----- Auth / bảo mật -----
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET cần tối thiểu 32 ký tự'),
    JWT_ACCESS_EXPIRES_IN: duration('15m'),
    REFRESH_TOKEN_EXPIRES_IN: duration('7d'),
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET cần tối thiểu 32 ký tự'),
    COOKIE_SECURE: z.stringbool().default(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    MAGIC_LINK_EXPIRES_IN: duration('15m'),
    EMAIL_VERIFY_EXPIRES_IN: duration('24h'),
    PASSWORD_RESET_EXPIRES_IN: duration('30m'),

    // ----- OAuth (để trống = tắt provider) -----
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    GITHUB_CLIENT_ID: optionalString,
    GITHUB_CLIENT_SECRET: optionalString,

    // ----- Mail -----
    MAIL_DRIVER: z.enum(['console', 'memory']).default('console'),
    MAIL_FROM: z.string().trim().min(3).default('Source Base <no-reply@example.com>'),

    // ----- Rate limit -----
    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

    // ----- Seed super admin (chỉ dùng cho `npm run seed`) -----
    SUPER_ADMIN_NAME: z.string().trim().default('Super Admin'),
    SUPER_ADMIN_EMAIL: optionalString,
    SUPER_ADMIN_PASSWORD: optionalString,
  })
  .superRefine((value, ctx) => {
    if (value.COOKIE_SAME_SITE === 'none' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SAME_SITE=none bắt buộc COOKIE_SECURE=true',
      });
    }
    if (value.NODE_ENV === 'production' && !value.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'Production bắt buộc COOKIE_SECURE=true (cookie chỉ gửi qua HTTPS)',
      });
    }
    for (const provider of ['GOOGLE', 'GITHUB']) {
      const id = value[`${provider}_CLIENT_ID`];
      const secret = value[`${provider}_CLIENT_SECRET`];
      if (Boolean(id) !== Boolean(secret)) {
        ctx.addIssue({
          code: 'custom',
          path: [`${provider}_CLIENT_SECRET`],
          message: `${provider}_CLIENT_ID và ${provider}_CLIENT_SECRET phải khai báo cùng nhau`,
        });
      }
    }
  });

/** Parse một object env bất kỳ (dùng trong test). Ném lỗi kèm mô tả dễ đọc nếu sai. */
export function parseEnv(source) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const error = new Error(
      `Biến môi trường không hợp lệ:\n${z.prettifyError(result.error)}\n` +
        '=> Kiểm tra backend/.env (so với backend/.env.example) hoặc chạy `npm run env:check`.',
    );
    error.name = 'EnvValidationError';
    throw error;
  }
  return Object.freeze(result.data);
}

export const env = parseEnv(process.env);
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
