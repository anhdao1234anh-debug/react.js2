import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AUTH_EVENTS, authEvents } from '@/core/api/httpClient';
import { toast } from '@/core/lib/toast';
import { clearSession } from '../lib/session';

/**
 * Cầu nối httpClient <-> TanStack Query: khi refresh token thất bại (hết phiên / bị thu hồi),
 * xoá phiên trong cache -> các guard tự chuyển người dùng về trang đăng nhập.
 */
export function AuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession(queryClient);
      toast.info('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
    };
    authEvents.addEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
    return () => authEvents.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, onUnauthorized);
  }, [queryClient]);

  return null;
}
