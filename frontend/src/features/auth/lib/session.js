// "Session" phía client = user hiện tại lưu trong TanStack Query cache (key: authKeys.session()).
//   data === undefined -> đang khởi tạo, null -> chưa đăng nhập, object -> đã đăng nhập.
import { queryOptions } from '@tanstack/react-query';
import { refreshSession } from '@/core/api/httpClient';
import { tokenStore } from '@/core/api/tokenStore';
import { authKeys } from '../authKeys';

/** Khởi tạo phiên khi mở app: dùng refresh cookie để lấy access token + user. */
export async function fetchSession() {
  try {
    const { user } = await refreshSession();
    return user;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) return null;
    throw error;
  }
}

export const sessionQueryOptions = queryOptions({
  queryKey: authKeys.session(),
  queryFn: fetchSession,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
});

/** Lưu phiên sau khi đăng nhập thành công (mọi phương thức). */
export function applySession(queryClient, { user, accessToken }) {
  if (accessToken) tokenStore.set(accessToken);
  queryClient.setQueryData(authKeys.session(), user);
}

/** Cập nhật một phần thông tin user trong phiên (vd sau khi sửa hồ sơ). */
export function patchSessionUser(queryClient, patch) {
  queryClient.setQueryData(authKeys.session(), (current) =>
    current ? { ...current, ...patch } : current,
  );
}

/** Xoá phiên + toàn bộ cache dữ liệu riêng tư (khi đăng xuất / hết phiên). */
export function clearSession(queryClient) {
  tokenStore.clear();
  // Giữ query session (đang có observer) và chỉ đặt về null; xoá mọi cache khác
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.all[0] });
  queryClient.removeQueries({ queryKey: authKeys.sessions() });
  queryClient.setQueryData(authKeys.session(), null);
}
