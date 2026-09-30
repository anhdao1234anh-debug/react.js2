// Tất cả đường dẫn của app ở MỘT chỗ - không hard-code chuỗi URL trong component.
// Lưu ý: các path /auth/* được backend dùng để tạo link email (backend/src/config/constants.js).
export const PATHS = Object.freeze({
  home: '/',
  about: '/about',
  contact: '/contact',
  products: '/products',
  productDetail: (id = ':id') => `/products/${id}`,

  login: '/auth/login',
  register: '/auth/register',
  magicLink: '/auth/magic-link',
  magicLinkVerify: '/auth/magic-link/verify',
  oauthCallback: '/auth/oauth/callback',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',

  dashboard: '/dashboard',
  account: '/dashboard/account',
  manageProducts: '/dashboard/products',
  manageUsers: '/dashboard/users',
});

/** Trang mặc định sau khi đăng nhập. */
export const DEFAULT_AUTHENTICATED_PATH = PATHS.dashboard;

/** Chỉ chấp nhận đường dẫn nội bộ (chống open redirect qua ?redirectTo=). */
export function safeRedirectPath(path, fallback = DEFAULT_AUTHENTICATED_PATH) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return fallback;
  if (path.startsWith('/auth/')) return fallback;
  return path;
}
