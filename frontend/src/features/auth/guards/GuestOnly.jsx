import { Navigate, Outlet, useSearchParams } from 'react-router';
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { safeRedirectPath } from '@/routes/paths';
import { useAuth } from '../hooks/useAuth';

/** Trang chỉ dành cho khách (đăng nhập, đăng ký...). Đã đăng nhập -> chuyển về redirectTo/dashboard. */
export function GuestOnly({ children }) {
  const { isLoading, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={safeRedirectPath(searchParams.get('redirectTo'))} replace />;
  }
  return children ?? <Outlet />;
}
