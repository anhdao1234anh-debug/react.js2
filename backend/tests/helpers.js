// Tiện ích dùng chung cho integration test.
import request from 'supertest';
import { API_PREFIX, COOKIE_NAMES } from '#config/constants.js';
import { mailOutbox } from '#core/mail/mailer.js';
import { ROLES } from '#core/rbac/roles.js';
import { hashPassword } from '#core/security/password.js';
import { User } from '#modules/user/user.model.js';
import { createApp } from '../src/app.js';

export const app = createApp();
export const api = (path) => `${API_PREFIX}${path}`;
export const DEFAULT_PASSWORD = 'Password123';

let counter = 0;

/** Tạo user trực tiếp trong DB. */
export async function createUser(overrides = {}) {
  counter += 1;
  const { password = DEFAULT_PASSWORD, ...rest } = overrides;
  return User.create({
    name: `User ${counter}`,
    email: `user${counter}_${Date.now()}@example.com`,
    role: ROLES.MEMBER,
    emailVerifiedAt: new Date(),
    ...(password !== null && { passwordHash: await hashPassword(password) }),
    ...rest,
  });
}

/** Đăng nhập qua API, trả về user + accessToken + cookie refresh. */
export async function loginAs(role = ROLES.MEMBER, overrides = {}) {
  const user = await createUser({ role, ...overrides });
  const res = await request(app)
    .post(api('/auth/login'))
    .send({ email: user.email, password: overrides.password ?? DEFAULT_PASSWORD })
    .expect(200);
  return {
    user,
    accessToken: res.body.data.accessToken,
    refreshCookie: getCookie(res, COOKIE_NAMES.REFRESH_TOKEN),
  };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/** Lấy chuỗi "name=value" của cookie trong response (để gửi lại ở request sau). */
export function getCookie(res, name) {
  const cookies = [].concat(res.headers['set-cookie'] ?? []);
  const raw = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return raw ? raw.split(';')[0] : undefined;
}

/** Lấy thuộc tính đầy đủ của cookie (HttpOnly, Path...) để kiểm tra. */
export function getRawCookie(res, name) {
  const cookies = [].concat(res.headers['set-cookie'] ?? []);
  return cookies.find((cookie) => cookie.startsWith(`${name}=`));
}

/** Lấy token trong link của email gần nhất gửi tới `to`. */
export function getTokenFromLastMail(to) {
  const mail = mailOutbox.findLast((item) => item.to === to);
  if (!mail) throw new Error(`Không có email nào gửi tới ${to}`);
  const match = /[?&]token=([\w-]+)/.exec(mail.text ?? mail.html);
  if (!match) throw new Error('Email không chứa token');
  return match[1];
}
