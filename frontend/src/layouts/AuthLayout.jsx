import { Link, Outlet } from 'react-router';
import { env } from '@/core/config/env';
import { PATHS } from '@/routes/paths';

/** Layout các trang xác thực: căn giữa, nền nhẹ. */
export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-gray-50 px-4 py-10">
      <Link to={PATHS.home} className="mb-6 text-xl font-bold text-brand-700">
        {env.appName}
      </Link>
      <Outlet />
    </div>
  );
}
