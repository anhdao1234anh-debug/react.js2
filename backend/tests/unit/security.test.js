import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { env } from '#config/env.js';
import { hashPassword, verifyPassword } from '#core/security/password.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
} from '#core/security/jwt.js';
import { generateToken, hashToken, safeEqual } from '#core/security/token.js';

describe('password (scrypt)', () => {
  it('hash rồi verify đúng/sai', async () => {
    const hash = await hashPassword('Secret123');
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(await verifyPassword('Secret123', hash)).toBe(true);
    expect(await verifyPassword('secret123', hash)).toBe(false);
  });

  it('mỗi lần hash có salt khác nhau', async () => {
    expect(await hashPassword('Secret123')).not.toBe(await hashPassword('Secret123'));
  });

  it('trả false với hash sai định dạng / thiếu', async () => {
    expect(await verifyPassword('x', 'bcrypt$abc')).toBe(false);
    expect(await verifyPassword('x', null)).toBe(false);
  });
});

describe('token', () => {
  it('generateToken tạo chuỗi base64url ngẫu nhiên', () => {
    const token = generateToken(32);
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(generateToken()).not.toBe(token);
  });

  it('hashToken ổn định và không lộ token gốc', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).toHaveLength(64);
  });

  it('safeEqual so sánh constant-time', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('jwt access token', () => {
  it('ký và xác thực payload', () => {
    const token = signAccessToken({ sub: 'u1', role: 'admin', sid: 's1' });
    const payload = verifyAccessToken(token);
    expect(payload).toMatchObject({ sub: 'u1', role: 'admin', sid: 's1', typ: 'access' });
    expect(payload.exp - payload.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
  });

  it('token hết hạn -> TOKEN_EXPIRED', () => {
    const expired = jwt.sign({ typ: 'access' }, env.JWT_ACCESS_SECRET, {
      subject: 'u1',
      expiresIn: -10,
      issuer: env.APP_NAME,
    });
    expect(() => verifyAccessToken(expired)).toThrow(
      expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
    );
  });

  it('sai chữ ký / sai thuật toán / sai loại token -> INVALID_TOKEN', () => {
    const wrongSecret = jwt.sign({ typ: 'access' }, 'x'.repeat(40), { issuer: env.APP_NAME });
    const noneAlg = jwt.sign({ typ: 'access' }, null, { algorithm: 'none', issuer: env.APP_NAME });
    const wrongType = jwt.sign({ typ: 'refresh' }, env.JWT_ACCESS_SECRET, { issuer: env.APP_NAME });

    for (const token of [wrongSecret, noneAlg, wrongType, 'garbage']) {
      expect(() => verifyAccessToken(token)).toThrow(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_TOKEN' }),
      );
    }
  });
});
