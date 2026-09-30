import { Link } from 'react-router';
import { QueryState } from '@/core/components/feedback/QueryState';
import { buttonVariants } from '@/core/components/ui';
import { env } from '@/core/config/env';
import { useAuth } from '@/features/auth';
import { ProductCard, useProducts } from '@/features/products';
import { PATHS } from '@/routes/paths';

const FEATURES = [
  { title: 'Xác thực 3 phương thức', text: 'Email/mật khẩu, OAuth (Google, GitHub), Magic link.' },
  { title: 'Phân quyền RBAC', text: '3 role: member, admin, superAdmin với ma trận permission.' },
  { title: 'Kiến trúc module', text: 'Core dùng chung + feature module dễ mở rộng ở cả FE và BE.' },
  { title: 'Chất lượng', text: 'Zod validate 2 đầu, ESLint + Prettier, test Vitest đầy đủ.' },
];

const LATEST_PARAMS = { page: 1, limit: 4, sort: '-createdAt' };

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const latestQuery = useProducts(LATEST_PARAMS);

  return (
    <div className="space-y-16">
      <section className="py-10 text-center md:py-16">
        <p className="text-sm font-semibold text-brand-600">Fullstack Source Base</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Khởi động dự án mới nhanh với {env.appName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          React + TanStack Query + Tailwind CSS ở frontend, Express + MongoDB ở backend. Tái sử dụng
          cho nhiều dự án có chung nền tảng tính năng.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to={isAuthenticated ? PATHS.dashboard : PATHS.register}
            className={buttonVariants({ size: 'lg' })}
          >
            {isAuthenticated ? 'Vào bảng điều khiển' : 'Bắt đầu ngay'}
          </Link>
          <Link
            to={PATHS.products}
            className={buttonVariants({ size: 'lg', variant: 'secondary' })}
          >
            Xem sản phẩm
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5"
          >
            <p className="font-semibold text-gray-900">{feature.title}</p>
            <p className="mt-1 text-sm text-gray-600">{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm mới</h2>
          <Link to={PATHS.products} className="text-sm font-medium text-brand-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <QueryState query={latestQuery}>
          {({ items }) => (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </QueryState>
      </section>
    </div>
  );
}
