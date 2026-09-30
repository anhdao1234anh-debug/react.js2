// Đọc & validate biến môi trường phía client (import.meta.env) bằng Zod.
// Chỉ biến có prefix VITE_ mới xuất hiện ở đây. KHÔNG đặt secret vào biến VITE_*.
import { z } from 'zod';

// Chuỗi rỗng ("KEY=") coi như không khai báo -> dùng default
const blankToUndefined = (value) => (value === '' ? undefined : value);

export const clientEnvSchema = z.object({
  VITE_APP_NAME: z.preprocess(blankToUndefined, z.string().default('Source Base')),
  VITE_API_URL: z.preprocess(blankToUndefined, z.string().default('/api/v1')),
  VITE_API_TIMEOUT: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().positive().default(15_000),
  ),
  VITE_ENABLE_QUERY_DEVTOOLS: z.preprocess(blankToUndefined, z.stringbool().default(false)),
});

export function parseClientEnv(source) {
  const result = clientEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Biến môi trường frontend không hợp lệ:\n${z.prettifyError(result.error)}`);
  }
  const data = result.data;
  return Object.freeze({
    appName: data.VITE_APP_NAME,
    apiUrl: data.VITE_API_URL.replace(/\/+$/, ''),
    apiTimeout: data.VITE_API_TIMEOUT,
    enableQueryDevtools: data.VITE_ENABLE_QUERY_DEVTOOLS,
    isDev: Boolean(source.DEV),
    mode: source.MODE,
  });
}

export const env = parseClientEnv(import.meta.env);
