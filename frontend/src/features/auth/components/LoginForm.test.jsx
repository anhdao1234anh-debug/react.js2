import { screen, waitFor } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { tokenStore } from '@/core/api/tokenStore';
import { buildUser } from '@/test/fixtures';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import { authKeys } from '../authKeys';
import { LoginForm } from './LoginForm';

const fillAndSubmit = async (
  user,
  { email = 'member@example.com', password = 'Password123' } = {},
) => {
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Mật khẩu'), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
};

describe('LoginForm', () => {
  it('validate phía client, không gọi API khi dữ liệu sai', async () => {
    const login = vi.fn(() => ok({}));
    server.use(http.post(apiUrl('/auth/login'), login));
    const { user } = renderWithProviders(<LoginForm />, { session: null });

    await fillAndSubmit(user, { email: 'khong-hop-le', password: '' });

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(login).not.toHaveBeenCalled();
  });

  it('đăng nhập thành công: lưu token + phiên, gọi onSuccess', async () => {
    const member = buildUser();
    let body;
    server.use(
      http.post(apiUrl('/auth/login'), async ({ request }) => {
        body = await request.json();
        return ok({ user: member, accessToken: 'access-1', expiresIn: 900 });
      }),
    );
    const onSuccess = vi.fn();
    const { user, queryClient } = renderWithProviders(<LoginForm onSuccess={onSuccess} />, {
      session: null,
    });

    await fillAndSubmit(user);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(body).toEqual({ email: 'member@example.com', password: 'Password123' });
    expect(tokenStore.get()).toBe('access-1');
    expect(queryClient.getQueryData(authKeys.session())).toEqual(member);
  });

  it('hiển thị lỗi từ server (sai mật khẩu)', async () => {
    server.use(
      http.post(apiUrl('/auth/login'), () =>
        fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng'),
      ),
    );
    const { user } = renderWithProviders(<LoginForm />, { session: null });

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
    expect(tokenStore.get()).toBeNull();
  });

  it('gắn lỗi validate 422 của server vào đúng field', async () => {
    server.use(
      http.post(apiUrl('/auth/login'), () =>
        fail(422, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', [
          { location: 'body', path: 'email', message: 'Email bị chặn' },
        ]),
      ),
    );
    const { user } = renderWithProviders(<LoginForm />, { session: null });
    await fillAndSubmit(user);
    expect(await screen.findByText('Email bị chặn')).toBeInTheDocument();
  });
});
