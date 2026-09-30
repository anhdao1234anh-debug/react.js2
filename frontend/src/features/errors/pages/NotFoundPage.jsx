import { Link } from 'react-router';
import { buttonVariants } from '@/core/components/ui';
import { PATHS } from '@/routes/paths';

export function NotFoundPage() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-gray-900">Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-gray-600">
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link to={PATHS.home} className={buttonVariants({ className: 'mt-6' })}>
        Về trang chủ
      </Link>
    </main>
  );
}

export default NotFoundPage;
