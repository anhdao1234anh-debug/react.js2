// Tầng gọi API của auth: chỉ lo HTTP, không chứa state/UI.
import { env } from '@/core/config/env';
import { NO_AUTH_REFRESH, httpClient, unwrap, unwrapMessage } from '@/core/api/httpClient';

export const authApi = {
  getProviders: () => httpClient.get('/auth/providers').then(unwrap),

  // ----- Email + mật khẩu -----
  register: (data) => httpClient.post('/auth/register', data, NO_AUTH_REFRESH).then(unwrap),
  login: (data) => httpClient.post('/auth/login', data, NO_AUTH_REFRESH).then(unwrap),
  verifyEmail: (token) =>
    httpClient.post('/auth/email/verify', { token }, NO_AUTH_REFRESH).then(unwrapMessage),
  resendVerification: () => httpClient.post('/auth/email/resend').then(unwrapMessage),
  forgotPassword: (data) =>
    httpClient.post('/auth/password/forgot', data, NO_AUTH_REFRESH).then(unwrapMessage),
  resetPassword: (data) =>
    httpClient.post('/auth/password/reset', data, NO_AUTH_REFRESH).then(unwrapMessage),
  changePassword: (data) => httpClient.patch('/auth/password', data).then(unwrap),

  // ----- Magic link -----
  requestMagicLink: (data) =>
    httpClient.post('/auth/magic-link', data, NO_AUTH_REFRESH).then(unwrapMessage),
  verifyMagicLink: (token) =>
    httpClient.post('/auth/magic-link/verify', { token }, NO_AUTH_REFRESH).then(unwrap),

  // ----- Phiên đăng nhập -----
  logout: () => httpClient.post('/auth/logout', null, NO_AUTH_REFRESH).then(unwrapMessage),
  logoutAll: () => httpClient.post('/auth/logout-all').then(unwrap),
  me: () => httpClient.get('/auth/me').then(unwrap),
  getSessions: () => httpClient.get('/auth/sessions').then(unwrap),
  revokeSession: (id) => httpClient.delete(`/auth/sessions/${id}`).then(unwrapMessage),

  /** OAuth là điều hướng toàn trang (không phải XHR): trình duyệt đi tới backend -> provider. */
  getOAuthUrl(provider, redirectTo) {
    const query = redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : '';
    return `${env.apiUrl}/auth/oauth/${provider}${query}`;
  },
};
