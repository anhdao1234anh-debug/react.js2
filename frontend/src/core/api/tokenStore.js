// Lưu access token TRONG BỘ NHỚ (không localStorage) -> script độc hại (XSS) khó đánh cắp.
// Reload trang => mất token => app tự gọi /auth/refresh (refresh token nằm trong cookie httpOnly).
let accessToken = null;
const listeners = new Set();

export const tokenStore = {
  get: () => accessToken,

  set(token) {
    accessToken = token || null;
    listeners.forEach((listener) => listener(accessToken));
  },

  clear() {
    tokenStore.set(null);
  },

  /** @returns {() => void} hàm huỷ đăng ký */
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
