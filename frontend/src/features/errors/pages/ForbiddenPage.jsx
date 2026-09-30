import { Link } from 'react-router';
import { buttonVariants } from '@/core/components/ui';
import { PATHS } from '@/routes/paths';

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-5xl font-bold text-brand-600">403</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tài khoản của bạn không được phép xem trang này. Liên hệ quản trị viên nếu cần cấp quyền.
      </p>
      <Link to={PATHS.dashboard} className={buttonVariants({ className: 'mt-6' })}>
        Về bảng điều khiển
      </Link>
    </div>
  );
}

export default ForbiddenPage;
