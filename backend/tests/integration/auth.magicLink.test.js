import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { COOKIE_NAMES } from '#config/constants.js';
import { mailOutbox } from '#core/mail/mailer.js';
import { Session } from '#modules/auth/session.model.js';
import { User } from '#modules/user/user.model.js';
import { api, app, bearer, createUser, getCookie, getTokenFromLastMail } from '#tests/helpers.js';

describe('Auth: magic link', () => {
  it('email mới: gửi link, xác thực -> tạo tài khoản (đã verify email) và đăng nhập', async () => {
    await request(app)
      .post(api('/auth/magic-link'))
      .send({ email: 'new.user@example.com', redirectTo: '/dashboard/products' })
      .expect(200);
    expect(await User.countDocuments()).toBe(0);
    expect(mailOutbox.at(-1).text).toContain('/auth/magic-link/verify?token=');

    const token = getTokenFromLastMail('new.user@example.com');
    const res = await request(app).post(api('/auth/magic-link/verify')).send({ token }).expect(200);

    expect(res.body.data.user).toMatchObject({
      email: 'new.user@example.com',
      name: 'new.user',
      role: 'member',
      isEmailVerified: true,
      hasPassword: false,
    });
    expect(res.body.data.redirectTo).toBe('/dashboard/products');
    expect(getCookie(res, COOKIE_NAMES.REFRESH_TOKEN)).toBeDefined();
    expect(await Session.findOne({ method: 'magic_link' })).not.toBeNull();

    await request(app).get(api('/auth/me')).set(bearer(res.body.data.accessToken)).expect(200);
  });

  it('email đã có tài khoản: đăng nhập vào đúng tài khoản đó và xác thực email', async () => {
    const user = await createUser({ emailVerifiedAt: null });
    await request(app).post(api('/auth/magic-link')).send({ email: user.email }).expect(200);
    const token = getTokenFromLastMail(user.email);

    const res = await request(app).post(api('/auth/magic-link/verify')).send({ token }).expect(200);
    expect(res.body.data.user).toMatchObject({
      id: user.id,
      hasPassword: true,
      isEmailVerified: true,
    });
    expect(await User.countDocuments()).toBe(1);
  });

  it('link chỉ dùng được 1 lần và link cũ mất hiệu lực khi yêu cầu link mới', async () => {
    await request(app).post(api('/auth/magic-link')).send({ email: 'x@example.com' });
    const first = getTokenFromLastMail('x@example.com');
    await request(app).post(api('/auth/magic-link')).send({ email: 'x@example.com' });
    const second = getTokenFromLastMail('x@example.com');

    await request(app).post(api('/auth/magic-link/verify')).send({ token: first }).expect(400);
    await request(app).post(api('/auth/magic-link/verify')).send({ token: second }).expect(200);
    await request(app).post(api('/auth/magic-link/verify')).send({ token: second }).expect(400);
  });

  it('chặn open redirect trong redirectTo', async () => {
    await request(app)
      .post(api('/auth/magic-link'))
      .send({ email: 'y@example.com', redirectTo: 'https://evil.com' });
    const token = getTokenFromLastMail('y@example.com');
    const res = await request(app).post(api('/auth/magic-link/verify')).send({ token });
    expect(res.body.data.redirectTo).toBeNull();
  });

  it('tài khoản bị khoá: không gửi mail, phản hồi vẫn giống bình thường', async () => {
    const user = await createUser({ isActive: false });
    const res = await request(app)
      .post(api('/auth/magic-link'))
      .send({ email: user.email })
      .expect(200);
    expect(res.body.message).toMatch(/Nếu email hợp lệ/);
    expect(mailOutbox).toHaveLength(0);
  });

  it('tài khoản bị khoá sau khi đã gửi link -> 403', async () => {
    const user = await createUser();
    await request(app).post(api('/auth/magic-link')).send({ email: user.email });
    const token = getTokenFromLastMail(user.email);
    await User.updateOne({ _id: user.id }, { isActive: false });
    await request(app).post(api('/auth/magic-link/verify')).send({ token }).expect(403);
  });

  it('validate input', async () => {
    await request(app).post(api('/auth/magic-link')).send({ email: 'bad' }).expect(422);
    await request(app).post(api('/auth/magic-link/verify')).send({ token: 'short' }).expect(422);
  });
});
