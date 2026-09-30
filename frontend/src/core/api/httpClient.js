// Axios instance dùng chung cho toàn app:
//  - Tự gắn "Authorization: Bearer <accessToken>"
//  - Gặp 401 => tự gọi /auth/refresh (1 lần duy nhất dù nhiều request cùng lỗi) rồi gửi lại request
//  - Refresh thất bại => phát sự kiện UNAUTHORIZED để app xoá phiên đăng nhập
//  - Mọi lỗi được chuẩn hoá thành ApiError
import axios from 'axios';
import { env } from '@/core/config/env';
import { toApiError } from './apiError';
import { tokenStore } from './tokenStore';

export const AUTH_EVENTS = Object.freeze({ UNAUTHORIZED: 'auth:unauthorized' });
export const authEvents = new EventTarget();

const baseConfig = {
  baseURL: env.apiUrl,
  timeout: env.apiTimeout,
  withCredentials: true, // gửi kèm cookie refresh_token
  headers: { Accept: 'application/json' },
};

export const httpClient = axios.create(baseConfig);

// Client riêng cho refresh: không đi qua interceptor => không lặp vô hạn
const refreshClient = axios.create(baseConfig);

let refreshPromise = null;

/**
 * Lấy access token mới từ refresh cookie. Các lời gọi đồng thời dùng chung 1 promise (single-flight).
 * @returns {Promise<{ user: object, accessToken: string, expiresIn: number }>}
 */
export function refreshSession() {
  refreshPromise ??= refreshClient
    .post('/auth/refresh')
    .then((response) => {
      const session = response.data.data;
      tokenStore.set(session.accessToken);
      return session;
    })
    .catch((error) => {
      tokenStore.clear();
      throw toApiError(error);
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

httpClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const shouldRefresh =
      error.response?.status === 401 && original && !original._retry && !original.skipAuthRefresh;

    if (!shouldRefresh) throw toApiError(error);

    original._retry = true;
    try {
      const { accessToken } = await refreshSession();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return await httpClient(original);
    } catch (retryError) {
      if (retryError?.status === 401 || retryError?.response?.status === 401) {
        authEvents.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
      }
      throw toApiError(retryError);
    }
  },
);

/** Lấy phần `data` trong response chuẩn { success, data, meta }. */
export const unwrap = (response) => response.data.data;

/** Response phân trang => { items, meta }. */
export const unwrapPage = (response) => ({ items: response.data.data, meta: response.data.meta });

/** Lấy message (vd "Đã gửi email...") từ response. */
export const unwrapMessage = (response) => response.data.message;

/** Tuỳ chọn cho request KHÔNG tự refresh khi 401 (login, register...). */
export const NO_AUTH_REFRESH = Object.freeze({ skipAuthRefresh: true });
