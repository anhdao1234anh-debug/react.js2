// Các mutation/query của auth. Side-effect về phiên (lưu token, xoá cache) xử lý TẠI ĐÂY,
// component chỉ lo điều hướng/hiển thị.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { authKeys } from '../authKeys';
import { applySession, clearSession, patchSessionUser } from '../lib/session';

/** Mutation trả về session ({ user, accessToken }) -> tự lưu phiên. */
function useSessionMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (session) => applySession(queryClient, session),
  });
}

export const useLogin = () => useSessionMutation(authApi.login);
export const useRegister = () => useSessionMutation(authApi.register);
export const useVerifyMagicLink = () => useSessionMutation(authApi.verifyMagicLink);

export const useRequestMagicLink = () => useMutation({ mutationFn: authApi.requestMagicLink });
export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });
export const useResendVerification = () => useMutation({ mutationFn: authApi.resendVerification });

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => patchSessionUser(queryClient, { isEmailVerified: true }),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      patchSessionUser(queryClient, { hasPassword: true });
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
}

/** Đăng xuất: dù API lỗi (mạng...) vẫn xoá phiên phía client. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => clearSession(queryClient),
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSettled: () => clearSession(queryClient),
  });
}

export function useAuthProviders() {
  return useQuery({
    queryKey: authKeys.providers(),
    queryFn: authApi.getProviders,
    staleTime: 5 * 60_000,
  });
}

export function useSessions() {
  return useQuery({ queryKey: authKeys.sessions(), queryFn: authApi.getSessions });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.sessions() }),
  });
}
