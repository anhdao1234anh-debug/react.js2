import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildUser } from '@/test/fixtures';
import { renderRoutes } from '@/test/render';
import { safeRedirectPath } from './paths';
import { routes } from './routes';

describe('app routes', () => {
  it('trang chủ (lazy load) trong MainLayout', async () => {
    renderRoutes({ routes, initialEntries: ['/'], session: null });
    expect(
      await screen.findByRole('heading', { level: 1, name: /Khởi động dự án/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('route không tồn tại -> 404', async () => {
    renderRoutes({ routes, initialEntries: ['/khong-co'], session: null });
    expect(await screen.findByText('Không tìm thấy trang')).toBeInTheDocument();
  });

  it('dashboard yêu cầu đăng nhập', async () => {
    renderRoutes({ routes, initialEntries: ['/dashboard'], session: null });
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('member vào dashboard: menu chỉ có mục được phép; vào /dashboard/users bị 403', async () => {
    const { router } = renderRoutes({
      routes,
      initialEntries: ['/dashboard'],
      session: buildUser(),
    });
    const menu = await screen.findByRole('navigation', { name: 'Menu quản trị' });
    expect(menu).toHaveTextContent('Tổng quan');
    expect(menu).not.toHaveTextContent('Người dùng');

    await router.navigate('/dashboard/users');
    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
  });

  it('đã đăng nhập mở /auth/login -> chuyển về dashboard', async () => {
    renderRoutes({ routes, initialEntries: ['/auth/login'], session: buildUser({ name: 'An' }) });
    expect(await screen.findByText('Xin chào, An 👋')).toBeInTheDocument();
  });
});

describe('safeRedirectPath', () => {
  it('chỉ nhận đường dẫn nội bộ, không quay lại trang auth', () => {
    expect(safeRedirectPath('/products?page=2')).toBe('/products?page=2');
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('/auth/login')).toBe('/dashboard');
    expect(safeRedirectPath(null, '/')).toBe('/');
  });
});
