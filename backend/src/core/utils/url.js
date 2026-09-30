/**
 * Ghép base URL + path + query string an toàn.
 * @example buildUrl('http://localhost:5173', '/auth/verify', { token: 'abc' })
 */
export function buildUrl(base, path = '', query = {}) {
  // Bỏ "/" đầu path để giữ nguyên sub-path của base (vd https://x.com/app + /login)
  const url = path
    ? new URL(path.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`)
    : new URL(base);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Chỉ chấp nhận đường dẫn tương đối nội bộ ("/dashboard") để chống Open Redirect
 * (kẻ xấu truyền redirectTo=https://evil.com).
 */
export function sanitizeRedirectPath(path, fallback = '/') {
  if (typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }
  return trimmed;
}
