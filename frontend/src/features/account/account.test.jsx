import { screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { tokenStore } from '@/core/api/tokenStore';
import { authKeys } from '@/features/auth/authKeys';
import { buildUser } from '@/test/fixtures';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import AccountPage from './pages/AccountPage';

const sessions = [
  {
    id: 's1',
    isCurrent: true,
    method: 'password',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0',
    ip: '127.0.0.1',
    lastUsedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 's2',
    isCurrent: false,
    method: 'oauth:google',
    userAgent: 'Mozilla/5.0 (iPhone) Safari/605.1',
    ip: '10.0.0.2',
    lastUsedAt: '2026-08-01T10:00:00Z',
  },
];

beforeEach(() => {
  server.use(http.get(apiUrl('/auth/sessions'), () => ok(sessions)));
});

describe('AccountPage', () => {
  it('cập nhật hồ sơ và đồng bộ vào phiên', async () => {
    server.use(
      http.patch(apiUrl('/users/me'), async ({ request }) => {
        const body = await request.json();
        return ok(buildUser({ ...body }));
      }),
    );
    const { user, queryClient } = renderWithProviders(<AccountPage />, { session: buildUser() });

    const saveButton = screen.getByRole('button', { name: 'Lưu hồ sơ' });
    expect(saveButton).toBeDisabled(); // chưa sửa gì
    const nameInput = screen.getByLabelText('Họ tên');
    await user.clear(nameInput);
    await user.type(nameInput, 'Tên Mới');
    await user.click(saveButton);

    expect(await screen.findByText('Đã cập nhật hồ sơ')).toBeInTheDocument();
    expect(queryClient.getQueryData(authKeys.session()).name).toBe('Tên Mới');
    expect(queryClient.getQueryData(authKeys.session()).hasPassword).toBe(true);
  });

  it('đổi mật khẩu: lỗi mật khẩu hiện tại từ server gắn vào field', async () => {
    server.use(
      http.patch(apiUrl('/auth/password'), () =>
        fail(400, 'INVALID_CREDENTIALS', 'Mật khẩu hiện tại không đúng', [
          { location: 'body', path: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' },
        ]),
      ),
    );
    const { user } = renderWithProviders(<AccountPage />, { session: buildUser() });

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'Wrong1234');
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPass123');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument();
  });

  it('tài khoản chưa có mật khẩu: đặt mật khẩu không cần mật khẩu cũ', async () => {
    let body;
    server.use(
      http.patch(apiUrl('/auth/password'), async ({ request }) => {
        body = await request.json();
        return ok(buildUser());
      }),
    );
    const { user } = renderWithProviders(<AccountPage />, {
      session: buildUser({ hasPassword: false }),
    });

    expect(screen.queryByLabelText('Mật khẩu hiện tại')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPass123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'NewPass123');
    await user.click(screen.getByRole('button', { name: 'Đặt mật khẩu' }));

    expect(await screen.findByText('Đã đặt mật khẩu')).toBeInTheDocument();
    expect(body).toEqual({ newPassword: 'NewPass123' });
  });

  it('liệt kê thiết bị và đăng xuất thiết bị khác', async () => {
    let revoked;
    server.use(
      http.delete(apiUrl('/auth/sessions/:id'), ({ params }) => {
        revoked = params.id;
        return ok(null, { message: 'ok' });
      }),
    );
    const { user } = renderWithProviders(<AccountPage />, { session: buildUser() });

    expect(await screen.findByText(/Chrome · Windows/)).toBeInTheDocument();
    expect(screen.getByText('Thiết bị này')).toBeInTheDocument();
    const otherDevice = screen.getByText(/Safari · iOS/).closest('li');
    expect(within(otherDevice).getByText(/Google/)).toBeInTheDocument();

    await user.click(within(otherDevice).getByRole('button', { name: 'Đăng xuất' }));
    expect(await screen.findByText('Đã đăng xuất thiết bị')).toBeInTheDocument();
    expect(revoked).toBe('s2');
  });

  it('đăng xuất mọi thiết bị: xoá phiên và về trang đăng nhập', async () => {
    server.use(http.post(apiUrl('/auth/logout-all'), () => ok({ revoked: 2 })));
    tokenStore.set('access');
    const { user, queryClient } = renderWithProviders(<AccountPage />, {
      path: '/dashboard/account',
      route: '/dashboard/account',
      session: buildUser(),
    });

    await user.click(await screen.findByRole('button', { name: 'Đăng xuất khỏi mọi thiết bị' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/auth/login');
    expect(tokenStore.get()).toBeNull();
    expect(queryClient.getQueryData(authKeys.session())).toBeNull();
  });

  it('nhắc xác thực email + gửi lại', async () => {
    server.use(
      http.post(apiUrl('/auth/email/resend'), () =>
        ok(null, { message: 'Đã gửi lại email xác thực' }),
      ),
    );
    const { user } = renderWithProviders(<AccountPage />, {
      session: buildUser({ isEmailVerified: false }),
    });
    expect(screen.getByText('Email chưa được xác thực')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gửi lại email' }));
    await waitFor(() =>
      expect(screen.getAllByText('Đã gửi lại email xác thực').length).toBeGreaterThan(0),
    );
  });
});
