import { useNavigate } from 'react-router';
import { getErrorMessage } from '@/core/api/apiError';
import { toast } from '@/core/lib/toast';
import { useLogoutAll, useRevokeSession, useSessions } from '@/features/auth';
import { PATHS } from '@/routes/paths';

/** Quản lý thiết bị đang đăng nhập: xem, thu hồi từng thiết bị, đăng xuất tất cả. */
export function useAccountSessions() {
  const navigate = useNavigate();
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAll();

  const revoke = async (session) => {
    try {
      await revokeSession.mutateAsync(session.id);
      toast.success('Đã đăng xuất thiết bị');
    } catch (error) {
      toast.error('Không thể thu hồi phiên', getErrorMessage(error));
    }
  };

  const logoutEverywhere = async () => {
    await logoutAll.mutateAsync().catch(() => undefined);
    toast.success('Đã đăng xuất khỏi mọi thiết bị');
    navigate(PATHS.login, { replace: true });
  };

  return {
    sessionsQuery,
    revoke,
    revokingId: revokeSession.isPending ? revokeSession.variables : null,
    logoutEverywhere,
    isLoggingOutAll: logoutAll.isPending,
  };
}
