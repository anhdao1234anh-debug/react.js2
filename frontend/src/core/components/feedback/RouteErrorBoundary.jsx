import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { buttonVariants } from '@/core/components/ui';

/** errorElement của router: bắt lỗi render / lỗi loader ở mọi route con. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const isResponse = isRouteErrorResponse(error);
  const title = isResponse ? `${error.status} - ${error.statusText}` : 'Đã có lỗi xảy ra';
  const message = isResponse ? error.data?.message : error?.message;

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-red-600">Lỗi ứng dụng</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{title}</h1>
      {message && <p className="mt-3 text-sm break-words text-gray-600">{message}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className={buttonVariants({ variant: 'secondary' })}
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </button>
        <Link to="/" className={buttonVariants()}>
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
