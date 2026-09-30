import { screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/core/api/tokenStore';
import { buildUser } from '@/test/fixtures';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import LoginPage from './LoginPage';
import MagicLinkPage from './MagicLinkPage';
import MagicLinkVerifyPage from './MagicLinkVerifyPage';
import OAuthCallbackPage from './OAuthCallbackPage';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';
import VerifyEmailPage from './VerifyEmailPage';

describe('LoginPage', () => {
  it('hiện nút OAuth theo provider backend bật + link magic link giữ redirectTo', async () => {
    renderWithProviders(<LoginPage />, {
      route: '/auth/login?redirectTo=/dashboard/products',
      path: '/auth/login',
      session: null,
    });
    const google = await screen.findByRole('link', { name: 'Tiếp tục với Google' });
    expect(google).toHaveAttribute(
      'href',
      '/api/v1/auth/oauth/google?redirectTo=%2Fdashboard%2Fproducts',
    );
    expect(screen.getByRole('link', { name: 'Tiếp tục với GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Magic link/ })).toHaveAttribute(
      'href',
      '/auth/magic-link?redirectTo=%2Fdashboard%2Fproducts',
    );
  });

  it('đăng nhập xong chuyển tới redirectTo', async () => {
    server.use(http.post(apiUrl('/auth/login'), () => ok({ user: buildUser(), accessToken: 't' })));
    const { user } = renderWithProviders(<LoginPage />, {
      route: '/auth/login?redirectTo=/products',
      path: '/auth/login',
      session: null,
    });
    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByTestId('location')).toHaveTextContent('/products');
  });
});

describe('RegisterPage', () => {
  it('bỏ confirmPassword khi gửi API và chuyển tới dashboard', async () => {
    let body;
    server.use(
      http.post(apiUrl('/auth/register'), async ({ request }) => {
        body = await request.json();
        return ok({ user: buildUser(), accessToken: 't' }, {});
      }),
    );
    const { user } = renderWithProviders(<RegisterPage />, { path: '/', session: null });
    await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn An');
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/dashboard');
    expect(body).toEqual({ name: 'Nguyễn An', email: 'an@example.com', password: 'Password123' });
  });

  it('email trùng -> lỗi 409 hiển thị ở đầu form', async () => {
    server.use(
      http.post(apiUrl('/auth/register'), () => fail(409, 'CONFLICT', 'Email đã được sử dụng')),
    );
    const { user } = renderWithProviders(<RegisterPage />, { session: null });
    await user.type(screen.getByLabelText('Họ tên'), 'Nguyễn An');
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'Password123');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email đã được sử dụng');
  });
});

describe('MagicLinkPage', () => {
  it('gửi email + redirectTo, hiển thị trạng thái đã gửi', async () => {
    let body;
    server.use(
      http.post(apiUrl('/auth/magic-link'), async ({ request }) => {
        body = await request.json();
        return ok(null, { message: 'Đã gửi' });
      }),
    );
    const { user } = renderWithProviders(<MagicLinkPage />, {
      route: '/auth/magic-link?redirectTo=/dashboard/account',
      path: '/auth/magic-link',
      session: null,
    });
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi liên kết đăng nhập' }));

    expect(await screen.findByText('Đã gửi liên kết!')).toBeInTheDocument();
    expect(screen.getByText('an@example.com')).toBeInTheDocument();
    expect(body).toEqual({ email: 'an@example.com', redirectTo: '/dashboard/account' });
  });
});

describe('MagicLinkVerifyPage', () => {
  it('tự xác thực token đúng 1 lần rồi chuyển tới redirectTo', async () => {
    const verify = vi.fn(() =>
      ok({ user: buildUser(), accessToken: 'magic-token', redirectTo: '/dashboard/account' }),
    );
    server.use(http.post(apiUrl('/auth/magic-link/verify'), verify));

    renderWithProviders(<MagicLinkVerifyPage />, {
      route: '/verify?token=abc',
      path: '/verify',
    });

    expect(await screen.findByTestId('location')).toHaveTextContent('/dashboard/account');
    expect(verify).toHaveBeenCalledTimes(1);
    expect(tokenStore.get()).toBe('magic-token');
  });

  it('token hết hạn -> báo lỗi + nút gửi lại', async () => {
    server.use(
      http.post(apiUrl('/auth/magic-link/verify'), () =>
        fail(400, 'INVALID_TOKEN', 'Liên kết không hợp lệ hoặc đã hết hạn'),
      ),
    );
    renderWithProviders(<MagicLinkVerifyPage />, { route: '/verify?token=abc', path: '/verify' });
    expect(await screen.findByRole('alert')).toHaveTextContent('đã hết hạn');
    expect(screen.getByRole('link', { name: 'Gửi liên kết mới' })).toBeInTheDocument();
  });

  it('không có token', async () => {
    renderWithProviders(<MagicLinkVerifyPage />, {
      route: '/verify',
      path: '/verify',
      session: null,
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('không hợp lệ');
  });
});

describe('OAuthCallbackPage', () => {
  it('thành công: lấy phiên từ refresh cookie rồi chuyển hướng', async () => {
    server.use(
      http.post(apiUrl('/auth/refresh'), () => ok({ user: buildUser(), accessToken: 'oauth' })),
    );
    renderWithProviders(<OAuthCallbackPage />, {
      route: '/cb?status=success&redirectTo=%2Fproducts',
      path: '/cb',
    });
    expect(await screen.findByTestId('location')).toHaveTextContent('/products');
  });

  it('lỗi: hiển thị message theo mã lỗi', async () => {
    renderWithProviders(<OAuthCallbackPage />, {
      route: '/cb?status=error&code=OAUTH_ACCESS_DENIED',
      path: '/cb',
      session: null,
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn đã huỷ cấp quyền đăng nhập.');
  });
});

describe('ResetPasswordPage', () => {
  it('gửi token + mật khẩu mới rồi về trang đăng nhập', async () => {
    let body;
    server.use(
      http.post(apiUrl('/auth/password/reset'), async ({ request }) => {
        body = await request.json();
        return ok(null, { message: 'Thành công' });
      }),
    );
    const { user } = renderWithProviders(<ResetPasswordPage />, {
      route: '/reset?token=tok-123',
      path: '/reset',
      session: null,
    });
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'NewPass123');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/auth/login');
    expect(body).toEqual({ token: 'tok-123', password: 'NewPass123' });
  });
});

describe('VerifyEmailPage', () => {
  it('xác thực và cập nhật trạng thái email trong phiên', async () => {
    server.use(
      http.post(apiUrl('/auth/email/verify'), () =>
        ok(null, { message: 'Xác thực email thành công' }),
      ),
    );
    const { queryClient } = renderWithProviders(<VerifyEmailPage />, {
      route: '/verify-email?token=tok',
      path: '/verify-email',
      session: buildUser({ isEmailVerified: false }),
    });
    expect(await screen.findByText('Xác thực email thành công')).toBeInTheDocument();
    await waitFor(() =>
      expect(queryClient.getQueryData(['auth', 'session']).isEmailVerified).toBe(true),
    );
  });
});
