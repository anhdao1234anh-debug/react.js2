import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientEnvSchema, parseClientEnv } from './env';

// Biến chỉ dùng trong vite.config.js (không nằm trong schema client)
const BUILD_ONLY_KEYS = ['DEV_PORT', 'DEV_API_PROXY_TARGET'];

// Vitest chạy với cwd = thư mục frontend
function readExampleKeys() {
  const content = readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter(Boolean);
}

describe('client env', () => {
  it('.env.example đồng bộ với clientEnvSchema + biến build', () => {
    const expected = [...Object.keys(clientEnvSchema.shape), ...BUILD_ONLY_KEYS].sort();
    expect(readExampleKeys().sort()).toEqual(expected);
  });

  it('áp dụng mặc định và chuẩn hoá apiUrl', () => {
    const env = parseClientEnv({
      VITE_API_URL: 'https://api.x.com/api/v1/',
      DEV: true,
      MODE: 'development',
    });
    expect(env).toMatchObject({
      appName: 'Source Base',
      apiUrl: 'https://api.x.com/api/v1',
      apiTimeout: 15000,
      enableQueryDevtools: false,
      isDev: true,
    });
  });

  it('chuỗi rỗng dùng mặc định; giá trị sai báo lỗi', () => {
    expect(parseClientEnv({ VITE_APP_NAME: '', VITE_ENABLE_QUERY_DEVTOOLS: 'true' })).toMatchObject(
      {
        appName: 'Source Base',
        enableQueryDevtools: true,
      },
    );
    expect(() => parseClientEnv({ VITE_API_TIMEOUT: 'abc' })).toThrow(/VITE_API_TIMEOUT/);
  });
});
