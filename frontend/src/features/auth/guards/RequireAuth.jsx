import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { Alert, Button } from '@/core/components/ui';
import { PATHS } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';

/**
 * Bảo vệ route cần đăng nhập. Chưa đăng nhập -> chuyển tới /auth/login?redirectTo=<trang hiện tại>.
 * Dùng làm layout route (render <Outlet/>) hoặc bọc children.
 */
export function RequireAuth({ children }) {
  const { isLoading, isAuthenticated, isError, retry } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Đang kiểm tra phiên đăng nhập..." />;

  if (isError) {
    return (
      <div className="mx-auto max-w-md p-6">
        <Alert
          variant="error"
          title="Không kết nối được máy chủ"
          action={
            <Button size="sm" variant="secondary" onClick={() => retry()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${PATHS.login}?redirectTo=${redirectTo}`} replace />;
  }

  return children ?? <Outlet />;
}
