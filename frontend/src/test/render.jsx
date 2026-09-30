// Tiện ích render có đủ provider (QueryClient, Router) cho test.
import { QueryClient } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, MemoryRouter, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from '@/app/AppProviders';
import { authKeys } from '@/features/auth/authKeys';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Hiển thị URL hiện tại để test kiểm tra điều hướng. */
export function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

/**
 * Render một cây route trong memory router.
 * @param {{ routes: import('react-router').RouteObject[], initialEntries?: string[],
 *           session?: object | null, queryClient?: QueryClient }} options
 *   session: undefined = để app tự gọi /auth/refresh; null = chưa đăng nhập; object = user đã đăng nhập
 */
export function renderRoutes({ routes, initialEntries = ['/'], session, queryClient } = {}) {
  const client = queryClient ?? createTestQueryClient();
  if (session !== undefined) client.setQueryData(authKeys.session(), session);
  const router = createMemoryRouter(routes, { initialEntries });
  const user = userEvent.setup();
  const result = render(
    <AppProviders queryClient={client}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, user, router, queryClient: client };
}

/** Render 1 component tại `route`, kèm route "*" hiển thị URL sau khi điều hướng. */
export function renderWithProviders(ui, { route = '/', path = '*', ...options } = {}) {
  const routes = [
    { path, element: ui },
    ...(path === '*' ? [] : [{ path: '*', element: <LocationDisplay /> }]),
  ];
  return renderRoutes({ routes, initialEntries: [route], ...options });
}

/** renderHook với QueryClientProvider + MemoryRouter (cho hook dùng useSearchParams/useNavigate). */
export function renderHookWithProviders(hook, { session, queryClient, route = '/' } = {}) {
  const client = queryClient ?? createTestQueryClient();
  if (session !== undefined) client.setQueryData(authKeys.session(), session);

  function Wrapper({ children }) {
    return (
      <AppProviders queryClient={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AppProviders>
    );
  }
  return { ...renderHook(hook, { wrapper: Wrapper }), queryClient: client };
}
