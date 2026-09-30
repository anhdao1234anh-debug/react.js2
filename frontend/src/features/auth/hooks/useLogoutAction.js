import { useNavigate } from 'react-router';
import { toast } from '@/core/lib/toast';
import { PATHS } from '@/routes/paths';
import { useLogout } from './useAuthMutations';

/** Đăng xuất + điều hướng về trang đăng nhập (dùng cho header, sidebar...). */
export function useLogoutAction() {
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = async () => {
    // Lỗi mạng vẫn coi như đã đăng xuất phía client (useLogout xoá phiên ở onSettled)
    await logout.mutateAsync().catch(() => undefined);
    toast.info('Đã đăng xuất');
    navigate(PATHS.login, { replace: true });
  };

  return { logout: handleLogout, isLoggingOut: logout.isPending };
}
