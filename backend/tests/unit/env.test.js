import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { envSchema, parseEnv } from '#config/env.js';

const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const VALID = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/app',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  COOKIE_SECRET: 'y'.repeat(32),
};

function readExampleKeys() {
  const content = readFileSync(path.join(BACKEND_ROOT, '.env.example'), 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
    .filter(Boolean);
}

describe('env config', () => {
  it('.env.example khai báo đúng và đủ các biến trong envSchema (luôn đồng bộ)', () => {
    const exampleKeys = readExampleKeys().sort();
    const schemaKeys = Object.keys(envSchema.shape).sort();
    expect(exampleKeys).toEqual(schemaKeys);
  });

  it('áp dụng giá trị mặc định', () => {
    const env = parseEnv(VALID);
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 8000,
      COOKIE_SECURE: false,
      COOKIE_SAME_SITE: 'lax',
      MAIL_DRIVER: 'console',
      CORS_ORIGINS: ['http://localhost:5173'],
    });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('tách CORS_ORIGINS thành mảng và coi chuỗi rỗng là không khai báo', () => {
    const env = parseEnv({
      ...VALID,
      CORS_ORIGINS: 'http://a.com, http://b.com,',
      GOOGLE_CLIENT_ID: '',
    });
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it('báo lỗi dễ đọc khi thiếu biến bắt buộc', () => {
    expect(() => parseEnv({})).toThrow(/MONGODB_URI/);
    expect(() => parseEnv({ ...VALID, JWT_ACCESS_SECRET: 'short' })).toThrow(/32 ký tự/);
  });

  it('chặn cấu hình cookie nguy hiểm', () => {
    expect(() => parseEnv({ ...VALID, COOKIE_SAME_SITE: 'none' })).toThrow(/COOKIE_SECURE/);
    expect(() => parseEnv({ ...VALID, NODE_ENV: 'production' })).toThrow(/Production/);
    expect(
      parseEnv({ ...VALID, NODE_ENV: 'production', COOKIE_SECURE: 'true' }).COOKIE_SECURE,
    ).toBe(true);
  });

  it('yêu cầu khai báo đủ cặp OAuth client id/secret', () => {
    expect(() => parseEnv({ ...VALID, GITHUB_CLIENT_ID: 'id' })).toThrow(/GITHUB_CLIENT_SECRET/);
  });

  it('validate định dạng thời lượng', () => {
    expect(() => parseEnv({ ...VALID, JWT_ACCESS_EXPIRES_IN: '15 minutes' })).toThrow(/thời lượng/);
  });
});
