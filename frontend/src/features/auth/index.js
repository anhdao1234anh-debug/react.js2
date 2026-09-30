// Public API của feature auth - feature khác chỉ import từ đây.
export { authApi } from './api/authApi';
export { authKeys } from './authKeys';
export { AuthSync } from './components/AuthSync';
export { ChangePasswordForm } from './components/ChangePasswordForm';
export { GuestOnly } from './guards/GuestOnly';
export { RequireAuth } from './guards/RequireAuth';
export { Can, RequirePermission } from './guards/RequirePermission';
export { useAuth } from './hooks/useAuth';
export {
  useAuthProviders,
  useChangePassword,
  useLogin,
  useLogout,
  useLogoutAll,
  useRegister,
  useResendVerification,
  useRevokeSession,
  useSessions,
} from './hooks/useAuthMutations';
export { useLogoutAction } from './hooks/useLogoutAction';
export { applySession, clearSession, patchSessionUser, sessionQueryOptions } from './lib/session';
