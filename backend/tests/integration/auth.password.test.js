import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { COOKIE_NAMES } from '#config/constants.js';
import { mailOutbox } from '#core/mail/mailer.js';
import { Session } from '#modules/auth/session.model.js';
import { REFRESH_REUSE_GRACE_MS } from '#modules/auth/session.service.js';
import { User } from '#modules/user/user.model.js';
import {
  DEFAULT_PASSWORD,
  api,
  app,
  bearer,
  createUser,
  getCookie,
  getRawCookie,
  getTokenFromLastMail,
  loginAs,
} from '#tests/helpers.js';

const REFRESH = COOKIE_NAMES.REFRESH_TOKEN;

describe('Auth: providers', () => {
  it('liệt kê phương thức đăng nhập đang bật', async () => {
    const res = await request(app).get(api('/auth/providers')).expect(200);
    expect(res.body.data).toEqual({
      methods: { password: true, magicLink: true },
      oauth: ['google', 'github'],
    });
  });
});

describe('Auth: đăng ký', () => {
  const payload = { name: 'Nguyễn Văn A', email: 'A@Example.com', password: 'Password123' };

  it('tạo tài khoản member, trả access token + set refresh cookie httpOnly, gửi mail xác thực', async () => {
    const res = await request(app).post(api('/auth/register')).send(payload).expect(201);

    expect(res.body.data.user).toMatchObject({
      name: 'Nguyễn Văn A',
      email: 'a@example.com',
      role: 'member',
      isEmailVerified: false,
      hasPassword: true,
    });
    expect(res.body.data.user.permissions).toContain('profile:read');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.expiresIn).toBe(900);

    const cookie = getRawCookie(res, REFRESH);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/);

    expect(mailOutbox).toHaveLength(1);
    expect(mailOutbox[0]).toMatchObject({ to: 'a@example.com' });
    expect(mailOutbox[0].text).toContain('http://localhost:5173/auth/verify-email?token=');
  });

  it('email trùng -> 409', async () => {
    await request(app).post(api('/auth/register')).send(payload).expect(201);
    const res = await request(app).post(api('/auth/register')).send(payload).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('dữ liệu không hợp lệ -> 422 với chi tiết từng trường', async () => {
    const res = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'A', email: 'not-an-email', password: 'short' })
      .expect(422);
    const paths = res.body.error.details.map((detail) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('Auth: đăng nhập', () => {
  it('đăng nhập thành công, cập nhật lastLoginAt và tạo session', async () => {
    const user = await createUser();
    const res = await request(app)
      .post(api('/auth/login'))
      .set('User-Agent', 'vitest-agent')
      .send({ email: user.email.toUpperCase(), password: DEFAULT_PASSWORD })
      .expect(200);

    expect(res.body.data.user.id).toBe(user.id);
    const reloaded = await User.findById(user.id);
    expect(reloaded.lastLoginAt).toBeInstanceOf(Date);
    const sessions = await Session.find({ user: user.id });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ method: 'password', userAgent: 'vitest-agent' });
  });

  it('sai mật khẩu hoặc email không tồn tại -> cùng lỗi 401 INVALID_CREDENTIALS', async () => {
    const user = await createUser();
    const wrongPassword = await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: 'Wrong12345' })
      .expect(401);
    const unknownEmail = await request(app)
      .post(api('/auth/login'))
      .send({ email: 'nobody@example.com', password: 'Wrong12345' })
      .expect(401);
    expect(wrongPassword.body.error).toEqual(unknownEmail.body.error);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('tài khoản không có mật khẩu (OAuth/magic link) không đăng nhập bằng mật khẩu được', async () => {
    const user = await createUser({ password: null });
    await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: 'Anything123' })
      .expect(401);
  });

  it('tài khoản bị khoá -> 403 ACCOUNT_DISABLED', async () => {
    const user = await createUser({ isActive: false });
    const res = await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: DEFAULT_PASSWORD })
      .expect(403);
    expect(res.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});

describe('Auth: /me và authenticate middleware', () => {
  it('trả user hiện tại kèm permissions', async () => {
    const { accessToken, user } = await loginAs('admin');
    const res = await request(app).get(api('/auth/me')).set(bearer(accessToken)).expect(200);
    expect(res.body.data).toMatchObject({ id: user.id, role: 'admin', hasPassword: true });
    expect(res.body.data.permissions).toContain('user:read');
  });

  it('thiếu / sai token -> 401', async () => {
    await request(app).get(api('/auth/me')).expect(401);
    const res = await request(app).get(api('/auth/me')).set(bearer('invalid')).expect(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
    await request(app).get(api('/auth/me')).set('Authorization', 'Basic abc').expect(401);
  });

  it('user bị khoá / bị xoá sau khi đăng nhập -> token mất hiệu lực ngay', async () => {
    const { accessToken, user } = await loginAs();
    await User.updateOne({ _id: user.id }, { isActive: false });
    await request(app).get(api('/auth/me')).set(bearer(accessToken)).expect(403);
    await User.deleteOne({ _id: user.id });
    await request(app).get(api('/auth/me')).set(bearer(accessToken)).expect(401);
  });
});

describe('Auth: refresh token rotation', () => {
  it('refresh trả access token mới và xoay refresh token', async () => {
    const { refreshCookie } = await loginAs();
    const res = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(res.body.data.accessToken).toEqual(expect.any(String));
    const nextCookie = getCookie(res, REFRESH);
    expect(nextCookie).toBeDefined();
    expect(nextCookie).not.toBe(refreshCookie);

    // Token mới dùng tiếp được
    await request(app).post(api('/auth/refresh')).set('Cookie', nextCookie).expect(200);
  });

  it('không có cookie -> 401 và xoá cookie', async () => {
    const res = await request(app).post(api('/auth/refresh')).expect(401);
    expect(getRawCookie(res, REFRESH)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('token cũ dùng lại trong grace period (nhiều tab) vẫn hợp lệ nhưng không phát cookie mới', async () => {
    const { refreshCookie } = await loginAs();
    await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie).expect(200);

    const parallel = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', refreshCookie)
      .expect(200);
    expect(parallel.body.data.accessToken).toEqual(expect.any(String));
    expect(getCookie(parallel, REFRESH)).toBeUndefined();
  });

  it('token cũ dùng lại SAU grace period -> nghi bị đánh cắp, thu hồi cả session', async () => {
    const { refreshCookie, user } = await loginAs();
    const rotated = await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie);
    const currentCookie = getCookie(rotated, REFRESH);

    // Giả lập đã quá grace period
    await Session.updateMany(
      { user: user.id },
      { rotatedAt: new Date(Date.now() - REFRESH_REUSE_GRACE_MS - 1000) },
    );

    const reuse = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', refreshCookie)
      .expect(401);
    expect(reuse.body.error.code).toBe('SESSION_REVOKED');

    // Kể cả token hợp lệ mới nhất cũng bị vô hiệu
    await request(app).post(api('/auth/refresh')).set('Cookie', currentCookie).expect(401);
    const session = await Session.findOne({ user: user.id });
    expect(session.revokedReason).toBe('reuse_detected');
  });

  it('session hết hạn -> 401 TOKEN_EXPIRED', async () => {
    const { refreshCookie, user } = await loginAs();
    await Session.updateMany({ user: user.id }, { expiresAt: new Date(Date.now() - 1000) });
    const res = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', refreshCookie)
      .expect(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('user bị khoá -> refresh thất bại và session bị thu hồi', async () => {
    const { refreshCookie, user } = await loginAs();
    await User.updateOne({ _id: user.id }, { isActive: false });
    await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie).expect(401);
    expect((await Session.findOne({ user: user.id })).revokedReason).toBe('user_inactive');
  });

  it('refresh token rác -> 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', `${REFRESH}=garbage`)
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('Auth: đăng xuất & quản lý phiên', () => {
  it('logout thu hồi session hiện tại', async () => {
    const { refreshCookie } = await loginAs();
    await request(app).post(api('/auth/logout')).set('Cookie', refreshCookie).expect(200);
    const res = await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', refreshCookie)
      .expect(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
  });

  it('logout khi không có cookie vẫn thành công', async () => {
    await request(app).post(api('/auth/logout')).expect(200);
  });

  it('logout-all thu hồi mọi thiết bị', async () => {
    const { user, accessToken, refreshCookie } = await loginAs();
    const second = await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: DEFAULT_PASSWORD });

    const res = await request(app)
      .post(api('/auth/logout-all'))
      .set(bearer(accessToken))
      .expect(200);
    expect(res.body.data.revoked).toBe(2);
    await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie).expect(401);
    await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', getCookie(second, REFRESH))
      .expect(401);
  });

  it('liệt kê và thu hồi từng thiết bị', async () => {
    const { user, accessToken } = await loginAs();
    await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: DEFAULT_PASSWORD });

    const list = await request(app).get(api('/auth/sessions')).set(bearer(accessToken)).expect(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.data.filter((session) => session.isCurrent)).toHaveLength(1);
    expect(list.body.data[0]).not.toHaveProperty('tokenHash');

    const other = list.body.data.find((session) => !session.isCurrent);
    await request(app)
      .delete(api(`/auth/sessions/${other.id}`))
      .set(bearer(accessToken))
      .expect(200);
    await request(app)
      .delete(api(`/auth/sessions/${other.id}`))
      .set(bearer(accessToken))
      .expect(404);

    const after = await request(app).get(api('/auth/sessions')).set(bearer(accessToken));
    expect(after.body.data).toHaveLength(1);
  });
});

describe('Auth: xác thực email', () => {
  it('verify bằng token trong email (dùng 1 lần)', async () => {
    const res = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'Bình', email: 'binh@example.com', password: 'Password123' });
    const token = getTokenFromLastMail('binh@example.com');

    await request(app).post(api('/auth/email/verify')).send({ token }).expect(200);
    const user = await User.findById(res.body.data.user.id);
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);

    const reused = await request(app).post(api('/auth/email/verify')).send({ token }).expect(400);
    expect(reused.body.error.code).toBe('INVALID_TOKEN');
  });

  it('gửi lại email xác thực (link cũ mất hiệu lực), báo lỗi nếu đã xác thực', async () => {
    const register = await request(app)
      .post(api('/auth/register'))
      .send({ name: 'Cường', email: 'cuong@example.com', password: 'Password123' });
    const oldToken = getTokenFromLastMail('cuong@example.com');
    const accessToken = register.body.data.accessToken;

    await request(app).post(api('/auth/email/resend')).set(bearer(accessToken)).expect(200);
    const newToken = getTokenFromLastMail('cuong@example.com');
    expect(newToken).not.toBe(oldToken);

    await request(app).post(api('/auth/email/verify')).send({ token: oldToken }).expect(400);
    await request(app).post(api('/auth/email/verify')).send({ token: newToken }).expect(200);
    await request(app).post(api('/auth/email/resend')).set(bearer(accessToken)).expect(400);
  });
});

describe('Auth: quên / đặt lại mật khẩu', () => {
  it('luồng đầy đủ: forgot -> reset -> mọi session bị thu hồi -> đăng nhập bằng mật khẩu mới', async () => {
    const { user, refreshCookie } = await loginAs();

    const forgot = await request(app)
      .post(api('/auth/password/forgot'))
      .send({ email: user.email })
      .expect(200);
    const token = getTokenFromLastMail(user.email);
    expect(mailOutbox.at(-1).text).toContain('/auth/reset-password?token=');

    await request(app)
      .post(api('/auth/password/reset'))
      .send({ token, password: 'NewPassword456' })
      .expect(200);

    await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie).expect(401);
    await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: DEFAULT_PASSWORD })
      .expect(401);
    await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: 'NewPassword456' })
      .expect(200);

    // Email không tồn tại cũng nhận cùng một message (chống dò email)
    const unknown = await request(app)
      .post(api('/auth/password/forgot'))
      .send({ email: 'ghost@example.com' })
      .expect(200);
    expect(unknown.body.message).toBe(forgot.body.message);
    expect(mailOutbox.filter((mail) => mail.to === 'ghost@example.com')).toHaveLength(0);
  });

  it('token sai / mật khẩu yếu bị từ chối', async () => {
    await request(app)
      .post(api('/auth/password/reset'))
      .send({ token: 'x'.repeat(43), password: 'NewPassword456' })
      .expect(400);
    await request(app)
      .post(api('/auth/password/reset'))
      .send({ token: 'x'.repeat(43), password: 'weak' })
      .expect(422);
  });
});

describe('Auth: đổi mật khẩu', () => {
  it('đổi thành công, giữ session hiện tại, thu hồi session khác', async () => {
    const { user, accessToken, refreshCookie } = await loginAs();
    const other = await request(app)
      .post(api('/auth/login'))
      .send({ email: user.email, password: DEFAULT_PASSWORD });

    await request(app)
      .patch(api('/auth/password'))
      .set(bearer(accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'Changed789' })
      .expect(200);

    await request(app).post(api('/auth/refresh')).set('Cookie', refreshCookie).expect(200);
    await request(app)
      .post(api('/auth/refresh'))
      .set('Cookie', getCookie(other, REFRESH))
      .expect(401);
  });

  it('sai mật khẩu hiện tại -> 400 INVALID_CREDENTIALS', async () => {
    const { accessToken } = await loginAs();
    const res = await request(app)
      .patch(api('/auth/password'))
      .set(bearer(accessToken))
      .send({ currentPassword: 'Wrong123', newPassword: 'Changed789' })
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('mật khẩu mới trùng mật khẩu cũ -> 422', async () => {
    const { accessToken } = await loginAs();
    await request(app)
      .patch(api('/auth/password'))
      .set(bearer(accessToken))
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: DEFAULT_PASSWORD })
      .expect(422);
  });
});
