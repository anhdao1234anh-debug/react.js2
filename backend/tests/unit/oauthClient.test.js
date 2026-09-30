import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthorizationUrl,
  createPkcePair,
  exchangeCode,
  fetchProfile,
  getEnabledProviders,
  getProvider,
  getRedirectUri,
} from '#core/oauth/oauthClient.js';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.restoreAllMocks());

describe('oauthClient', () => {
  it('liệt kê provider đã cấu hình', () => {
    expect(getEnabledProviders()).toEqual(['google', 'github']);
  });

  it('provider không tồn tại -> OAUTH_PROVIDER_DISABLED', () => {
    expect(() => getProvider('facebook')).toThrow(
      expect.objectContaining({ code: 'OAUTH_PROVIDER_DISABLED' }),
    );
    expect(() => getProvider('__proto__')).toThrow();
  });

  it('redirect URI trỏ về backend', () => {
    expect(getRedirectUri('google')).toBe(
      'http://localhost:8000/api/v1/auth/oauth/google/callback',
    );
  });

  it('PKCE: challenge = base64url(sha256(verifier))', () => {
    const { codeVerifier, codeChallenge } = createPkcePair();
    expect(codeChallenge).toBe(createHash('sha256').update(codeVerifier).digest('base64url'));
  });

  it('build URL Google có PKCE, GitHub thì không', () => {
    const google = new URL(buildAuthorizationUrl('google', { state: 's1', codeChallenge: 'c1' }));
    expect(google.origin + google.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(google.searchParams)).toMatchObject({
      client_id: 'google-client-id',
      response_type: 'code',
      scope: 'openid email profile',
      state: 's1',
      code_challenge: 'c1',
      code_challenge_method: 'S256',
    });

    const github = new URL(buildAuthorizationUrl('github', { state: 's2', codeChallenge: 'c2' }));
    expect(github.searchParams.get('code_challenge')).toBeNull();
    expect(github.searchParams.get('scope')).toBe('read:user user:email');
  });

  it('exchangeCode gửi form-urlencoded và trả access token', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ access_token: 'provider-token' }));

    await expect(exchangeCode('google', { code: 'abc', codeVerifier: 'v' })).resolves.toBe(
      'provider-token',
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    expect(init.body.get('code_verifier')).toBe('v');
    expect(init.body.get('grant_type')).toBe('authorization_code');
  });

  it('exchangeCode báo OAUTH_FAILED khi provider trả lỗi / thiếu token / mất mạng', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'bad_verification_code' }));
    await expect(exchangeCode('github', { code: 'x' })).rejects.toMatchObject({
      code: 'OAUTH_FAILED',
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await expect(exchangeCode('github', { code: 'x' })).rejects.toMatchObject({
      code: 'OAUTH_FAILED',
    });

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(exchangeCode('github', { code: 'x' })).rejects.toMatchObject({
      code: 'OAUTH_FAILED',
      statusCode: 502,
    });
  });

  it('chuẩn hoá profile Google', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        sub: '123',
        email: 'A@Gmail.com',
        email_verified: true,
        name: 'An',
        picture: 'p',
      }),
    );
    await expect(fetchProfile('google', 't')).resolves.toEqual({
      providerId: '123',
      email: 'a@gmail.com',
      emailVerified: true,
      name: 'An',
      avatarUrl: 'p',
    });
  });

  it('chuẩn hoá profile GitHub, lấy email primary đã verify', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url).endsWith('/emails')
        ? jsonResponse([
            { email: 'old@x.com', primary: false, verified: true },
            { email: 'Main@x.com', primary: true, verified: true },
          ])
        : jsonResponse({ id: 42, login: 'octo', name: null, email: null, avatar_url: 'a' }),
    );
    await expect(fetchProfile('github', 't')).resolves.toEqual({
      providerId: '42',
      email: 'main@x.com',
      emailVerified: true,
      name: 'octo',
      avatarUrl: 'a',
    });
  });
});
