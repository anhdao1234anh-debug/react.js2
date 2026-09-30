// Test các trang/thành phần nhỏ: liên hệ, quên mật khẩu, header, pagination, error boundary.
import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from '@/core/components/feedback/RouteErrorBoundary';
import { Pagination } from '@/core/components/ui';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import AboutPage from '@/features/home/pages/AboutPage';
import ContactPage from '@/features/home/pages/ContactPage';
import { MainLayout } from '@/layouts/MainLayout';
import { buildUser, pageMeta } from '@/test/fixtures';
import { apiUrl, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderRoutes, renderWithProviders } from '@/test/render';

describe('ContactPage', () => {
  it('validate rồi gửi (demo) và reset form', async () => {
    const { user } = renderWithProviders(<ContactPage />);
    await user.click(screen.getByRole('button', { name: 'Gửi liên hệ' }));
    expect(await screen.findByText('Nội dung tối thiểu 10 ký tự')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn An');
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.type(screen.getByLabelText('Nội dung'), 'Tôi muốn hợp tác với bạn.');
    await user.click(screen.getByRole('button', { name: 'Gửi liên hệ' }));

    expect(await screen.findByText('Đã gửi liên hệ')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toHaveValue('');
  });
});

describe('AboutPage', () => {
  it('hiển thị stack công nghệ', () => {
    renderWithProviders(<AboutPage />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage', () => {
  it('hiển thị message chung của server sau khi gửi', async () => {
    server.use(
      http.post(apiUrl('/auth/password/forgot'), () =>
        ok(null, { message: 'Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn' }),
      ),
    );
    const { user } = renderWithProviders(<ForgotPasswordPage />, { session: null });
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi hướng dẫn' }));
    expect(
      await screen.findByText('Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn'),
    ).toBeInTheDocument();
  });
});

describe('SiteHeader (MainLayout)', () => {
  it('đã đăng nhập: hiện tên và đăng xuất được', async () => {
    const logout = vi.fn(() => ok(null, { message: 'Đã đăng xuất' }));
    server.use(http.post(apiUrl('/auth/logout'), logout));
    const { user } = renderRoutes({
      routes: [
        { path: '/', element: <MainLayout />, children: [{ index: true, element: <p>Home</p> }] },
        { path: '/auth/login', element: <p>Trang đăng nhập</p> },
      ],
      session: buildUser({ name: 'An Nguyễn' }),
    });

    expect(screen.getAllByText('An Nguyễn').length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: 'Đăng xuất' })[0]);
    expect(await screen.findByText('Trang đăng nhập')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('menu mobile mở/đóng', async () => {
    const { user } = renderRoutes({
      routes: [
        { path: '/', element: <MainLayout />, children: [{ index: true, element: <p>Home</p> }] },
      ],
      session: null,
    });
    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Sản phẩm' })).toHaveLength(2);
  });
});

describe('Pagination', () => {
  it('ẩn khi chỉ có 1 trang; điều hướng trang trước/sau', async () => {
    const onPageChange = vi.fn();
    const { rerender, user } = renderWithProviders(
      <Pagination meta={pageMeta(5, { limit: 10 })} onPageChange={onPageChange} />,
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    rerender(
      <Pagination meta={pageMeta(25, { page: 2, limit: 10 })} onPageChange={onPageChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Sau' }));
    await user.click(screen.getByRole('button', { name: 'Trước' }));
    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });
});

describe('RouteErrorBoundary', () => {
  it('bắt lỗi render và cho phép về trang chủ', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() {
      throw new Error('Component hỏng');
    }
    renderRoutes({
      routes: [{ path: '/', element: <Broken />, errorElement: <RouteErrorBoundary /> }],
      session: null,
    });
    expect(await screen.findByText('Đã có lỗi xảy ra')).toBeInTheDocument();
    expect(screen.getByText('Component hỏng')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
    vi.restoreAllMocks();
  });
});
