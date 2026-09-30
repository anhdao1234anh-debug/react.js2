import { AUTH_COOKIE_PATH, COOKIE_NAMES } from '#config/constants.js';
import { env } from '#config/env.js';
import { parseDuration } from '#core/utils/duration.js';

/** Tuỳ chọn cookie chung: httpOnly (JS không đọc được) + secure/sameSite theo env. */
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
  };
}

export function refreshCookieOptions() {
  return {
    ...baseCookieOptions(),
    path: AUTH_COOKIE_PATH,
    maxAge: parseDuration(env.REFRESH_TOKEN_EXPIRES_IN),
  };
}

/** @param {import('express').Response} res */
export function setRefreshCookie(res, refreshToken) {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions());
}

/** @param {import('express').Response} res */
export function clearRefreshCookie(res) {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, options);
}

/** Cookie tạm lưu state OAuth (ký bằng COOKIE_SECRET để chống giả mạo), sống 10 phút. */
export function oauthStateCookieOptions() {
  return {
    ...baseCookieOptions(),
    // OAuth callback là điều hướng top-level từ provider -> cần 'lax' để cookie được gửi kèm
    sameSite: env.COOKIE_SAME_SITE === 'strict' ? 'lax' : env.COOKIE_SAME_SITE,
    signed: true,
    path: `${AUTH_COOKIE_PATH}/oauth`,
    maxAge: 10 * 60 * 1000,
  };
}
