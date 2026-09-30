// Khai báo cây route (tách riêng khỏi createBrowserRouter -> test được bằng createMemoryRouter).
// Trang được lazy-load (code splitting): mỗi trang là 1 chunk JS riêng, chỉ tải khi truy cập.
import { PageLoader } from '@/core/components/feedback/PageLoader';
import { RouteErrorBoundary } from '@/core/components/feedback/RouteErrorBoundary';
import { PERMISSIONS } from '@/core/constants/rbac';
import { GuestOnly, RequireAuth, RequirePermission } from '@/features/auth';
import NotFoundPage from '@/features/errors/pages/NotFoundPage';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { RootLayout } from '@/layouts/RootLayout';

/** Chuyển `import()` của trang (default export) sang định dạng `lazy` của React Router. */
const page = (importer) => async () => ({ Component: (await importer()).default });

export const routes = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      // ----- Public -----
      {
        element: <MainLayout />,
        children: [
          { index: true, lazy: page(() => import('@/features/home/pages/HomePage')) },
          { path: 'about', lazy: page(() => import('@/features/home/pages/AboutPage')) },
          { path: 'contact', lazy: page(() => import('@/features/home/pages/ContactPage')) },
          {
            path: 'products',
            lazy: page(() => import('@/features/products/pages/ProductListPage')),
          },
          {
            path: 'products/:id',
            lazy: page(() => import('@/features/products/pages/ProductDetailPage')),
          },
        ],
      },

      // ----- Auth -----
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          {
            // Chỉ dành cho khách: đã đăng nhập sẽ bị chuyển về dashboard
            element: <GuestOnly />,
            children: [
              { path: 'login', lazy: page(() => import('@/features/auth/pages/LoginPage')) },
              { path: 'register', lazy: page(() => import('@/features/auth/pages/RegisterPage')) },
              {
                path: 'magic-link',
                lazy: page(() => import('@/features/auth/pages/MagicLinkPage')),
              },
              {
                path: 'forgot-password',
                lazy: page(() => import('@/features/auth/pages/ForgotPasswordPage')),
              },
              {
                path: 'reset-password',
                lazy: page(() => import('@/features/auth/pages/ResetPasswordPage')),
              },
            ],
          },
          // Trang đích từ email / OAuth: truy cập được cả khi đã đăng nhập
          {
            path: 'magic-link/verify',
            lazy: page(() => import('@/features/auth/pages/MagicLinkVerifyPage')),
          },
          {
            path: 'oauth/callback',
            lazy: page(() => import('@/features/auth/pages/OAuthCallbackPage')),
          },
          {
            path: 'verify-email',
            lazy: page(() => import('@/features/auth/pages/VerifyEmailPage')),
          },
        ],
      },

      // ----- Dashboard (cần đăng nhập) -----
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, lazy: page(() => import('@/features/dashboard/pages/DashboardPage')) },
          { path: 'account', lazy: page(() => import('@/features/account/pages/AccountPage')) },
          {
            element: <RequirePermission permission={PERMISSIONS.PRODUCT_CREATE} />,
            children: [
              {
                path: 'products',
                lazy: page(() => import('@/features/products/pages/ProductManagementPage')),
              },
            ],
          },
          {
            element: <RequirePermission permission={PERMISSIONS.USER_READ} />,
            children: [
              { path: 'users', lazy: page(() => import('@/features/users/pages/UsersPage')) },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
