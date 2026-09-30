// Hằng số dùng toàn backend (không phụ thuộc môi trường).

export const API_PREFIX = '/api/v1';

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

export const COOKIE_NAMES = Object.freeze({
  REFRESH_TOKEN: 'refresh_token',
  OAUTH_STATE: 'oauth_state',
});

/** Đường dẫn cookie refresh: chỉ gửi kèm request tới nhóm route /auth. */
export const AUTH_COOKIE_PATH = `${API_PREFIX}/auth`;

/** Các đường dẫn frontend mà backend tạo link tới (email, redirect OAuth). */
export const FRONTEND_PATHS = Object.freeze({
  MAGIC_LINK_VERIFY: '/auth/magic-link/verify',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/auth/reset-password',
  OAUTH_CALLBACK: '/auth/oauth/callback',
});
