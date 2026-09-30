import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_NAMES } from '#config/constants.js';
import { Session } from '#modules/auth/session.model.js';
import { User } from '#modules/user/user.model.js';
import { api, app, createUser, getCookie } from '#tests/helpers.js';

const STATE_COOKIE = COOKIE_NAMES.OAUTH_STATE;

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Giả lập Google: token endpoint + userinfo endpoint. */
function mockGoogle(profile) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return jsonResponse({ access_token: 'google-access-token' });
    }
    return jsonResponse({
      sub: 'google-123',
      email: 'oauth.user@gmail.com',
      email_verified: true,
      name: 'OAuth User',
      picture: 'https://img.example.com/a.png',
      ...profile,
    });
  });
}

/** Bắt đầu OAuth -> lấy state + cookie state đã ký. */
async function startOAuth(provider = 'google', query = {}) {
  const res = await request(app)
    .get(api(`/auth/oauth/${provider}`))
    .query(query)
    .expect(302);
  const location = new URL(res.headers.location);
  return {
    state: location.searchParams.get('state'),
    cookie: getCookie(res, STATE_COOKIE),
    location,
  };
}

function callback(provider, { state, cookie, code = 'auth-code' }) {
  const req = request(app)
    .get(api(`/auth/oauth/${provider}/callback`))
    .query({ code, state });
  return cookie ? req.set('Cookie', cookie) : req;
}

const frontendRedirect = (res) => new URL(res.headers.location);

afterEach(() => vi.restoreAllMocks());

describe('Auth: OAuth', () => {
  it('start: redirect tới Google kèm state + PKCE và set cookie state đã ký', async () => {
    const { location, state, cookie } = await startOAuth('google', { redirectTo: '/dashboard' });
    expect(location.host).toBe('accounts.google.com');
    expect(location.searchParams.get('code_challenge_method')).toBe('S256');
    expect(state).toHaveLength(32);
    expect(cookie).toMatch(/^oauth_state=s%3A/); // "s:" = signed cookie
  });

  it('provider không hỗ trợ -> 422', async () => {
    await request(app).get(api('/auth/oauth/facebook')).expect(422);
  });

  it('callback thành công: tạo user mới, set refresh cookie, redirect về frontend', async () => {
    const fetchMock = mockGoogle();
    const { state, cookie } = await startOAuth('google', { redirectTo: '/dashboard/account' });

    const res = await callback('google', { state, cookie }).expect(302);
    const redirect = frontendRedirect(res);
    expect(redirect.origin + redirect.pathname).toBe('http://localhost:5173/auth/oauth/callback');
    expect(Object.fromEntries(redirect.searchParams)).toEqual({
      status: 'success',
      provider: 'google',
      redirectTo: '/dashboard/account',
    });
    expect(getCookie(res, COOKIE_NAMES.REFRESH_TOKEN)).toBeDefined();

    // Gửi đúng code + code_verifier lên token endpoint
    const tokenCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/token'));
    expect(tokenCall[1].body.get('code')).toBe('auth-code');
    expect(tokenCall[1].body.get('code_verifier')).toEqual(expect.any(String));

    const user = await User.findOne({ email: 'oauth.user@gmail.com' });
    expect(user).toMatchObject({ name: 'OAuth User', role: 'member' });
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.oauthAccounts[0]).toMatchObject({ provider: 'google', providerId: 'google-123' });
    expect(await Session.findOne({ method: 'oauth:google' })).not.toBeNull();

    // Frontend dùng refresh cookie để lấy access token
    const refresh = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', getCookie(res, COOKIE_NAMES.REFRESH_TOKEN))
      .expect(200);
    expect(refresh.body.data.user.email).toBe('oauth.user@gmail.com');
  });

  it('lần đăng nhập sau tìm theo providerId, không tạo trùng', async () => {
    mockGoogle();
    for (let i = 0; i < 2; i += 1) {
      const { state, cookie } = await startOAuth();
      await callback('google', { state, cookie }).expect(302);
    }
    expect(await User.countDocuments()).toBe(1);
  });

  it('liên kết vào tài khoản sẵn có khi provider xác nhận email', async () => {
    const existing = await createUser({ email: 'oauth.user@gmail.com', emailVerifiedAt: null });
    mockGoogle();
    const { state, cookie } = await startOAuth();
    const res = await callback('google', { state, cookie });
    expect(frontendRedirect(res).searchParams.get('status')).toBe('success');

    const user = await User.findById(existing.id);
    expect(user.oauthAccounts).toHaveLength(1);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(await User.countDocuments()).toBe(1);
  });

  it('KHÔNG liên kết khi email chưa được provider xác nhận (chống chiếm tài khoản)', async () => {
    await createUser({ email: 'oauth.user@gmail.com' });
    mockGoogle({ email_verified: false });
    const { state, cookie } = await startOAuth();
    const res = await callback('google', { state, cookie });
    expect(Object.fromEntries(frontendRedirect(res).searchParams)).toEqual({
      status: 'error',
      code: 'CONFLICT',
    });
  });

  it('state sai / thiếu cookie / cookie bị sửa -> OAUTH_STATE_MISMATCH', async () => {
    mockGoogle();
    const { cookie } = await startOAuth();
    const wrongState = await callback('google', { state: 'x'.repeat(32), cookie });
    const noCookie = await callback('google', { state: 'x'.repeat(32) });
    const tampered = await callback('google', {
      state: 'x',
      cookie: cookie.replace(/.$/, (char) => (char === 'a' ? 'b' : 'a')),
    });
    for (const res of [wrongState, noCookie, tampered]) {
      expect(frontendRedirect(res).searchParams.get('code')).toBe('OAUTH_STATE_MISMATCH');
    }
  });

  it('người dùng từ chối cấp quyền -> OAUTH_ACCESS_DENIED', async () => {
    const res = await request(app)
      .get(api('/auth/oauth/google/callback'))
      .query({ error: 'access_denied' })
      .expect(302);
    expect(frontendRedirect(res).searchParams.get('code')).toBe('OAUTH_ACCESS_DENIED');
  });

  it('provider không trả email -> OAUTH_EMAIL_REQUIRED', async () => {
    mockGoogle({ email: undefined });
    const { state, cookie } = await startOAuth();
    const res = await callback('google', { state, cookie });
    expect(frontendRedirect(res).searchParams.get('code')).toBe('OAUTH_EMAIL_REQUIRED');
  });

  it('tài khoản bị khoá -> ACCOUNT_DISABLED', async () => {
    await createUser({ email: 'oauth.user@gmail.com', isActive: false });
    mockGoogle();
    const { state, cookie } = await startOAuth();
    const res = await callback('google', { state, cookie });
    expect(frontendRedirect(res).searchParams.get('code')).toBe('ACCOUNT_DISABLED');
  });

  it('GitHub: không dùng PKCE, lấy email primary', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const target = String(url);
      if (target.includes('/access_token')) return jsonResponse({ access_token: 'gh-token' });
      if (target.endsWith('/user/emails')) {
        return jsonResponse([{ email: 'dev@github.com', primary: true, verified: true }]);
      }
      return jsonResponse({ id: 99, login: 'octocat', name: 'Octo Cat', avatar_url: 'a' });
    });
    const { state, cookie, location } = await startOAuth('github');
    expect(location.searchParams.get('code_challenge')).toBeNull();

    const res = await callback('github', { state, cookie });
    expect(frontendRedirect(res).searchParams.get('status')).toBe('success');
    expect(await User.findOne({ email: 'dev@github.com' })).toMatchObject({ name: 'Octo Cat' });
  });
});
