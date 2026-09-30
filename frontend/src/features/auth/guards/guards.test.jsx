import { screen } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@/core/constants/rbac';
import { buildUser } from '@/test/fixtures';
import { apiUrl, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { LocationDisplay, renderRoutes } from '@/test/render';
import { GuestOnly } from './GuestOnly';
import { RequireAuth } from './RequireAuth';
import { Can, RequirePermission } from './RequirePermission';

const routes = [
  {
    path: '/private',
    element: <RequireAuth />,
    children: [
      { index: true, element: <p>Nội dung riêng tư</p> },
      {
        path: 'admin',
        element: <RequirePermission permission={PERMISSIONS.USER_READ} />,
        children: [{ index: true, element: <p>Khu vực admin</p> }],
      },
    ],
  },
  { path: '/guest', element: <GuestOnly>{<p>Trang khách</p>}</GuestOnly> },
  { path: '*', element: <LocationDisplay /> },
];

describe('RequireAuth', () => {
  it('chưa đăng nhập -> chuyển tới login kèm redirectTo', async () => {
    renderRoutes({ routes, initialEntries: ['/private?tab=1'], session: null });
    expect(await screen.findByTestId('location')).toHaveTextContent(
      '/auth/login?redirectTo=%2Fprivate%3Ftab%3D1',
    );
  });

  it('khôi phục phiên từ refresh cookie khi mở app', async () => {
    server.use(
      http.post(apiUrl('/auth/refresh'), () =>
        ok({ user: buildUser(), accessToken: 'restored', expiresIn: 900 }),
      ),
    );
    renderRoutes({ routes, initialEntries: ['/private'] });
    expect(screen.getByText('Đang kiểm tra phiên đăng nhập...')).toBeInTheDocument();
    expect(await screen.findByText('Nội dung riêng tư')).toBeInTheDocument();
  });

  it('lỗi mạng khi khôi phục phiên -> hiện nút thử lại', async () => {
    server.use(http.post(apiUrl('/auth/refresh'), () => new Response(null, { status: 503 })));
    renderRoutes({ routes, initialEntries: ['/private'] });
    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});

describe('RequirePermission', () => {
  it('member vào trang admin -> 403', async () => {
    renderRoutes({ routes, initialEntries: ['/private/admin'], session: buildUser() });
    expect(await screen.findByText('Không có quyền truy cập')).toBeInTheDocument();
  });

  it('admin vào được', async () => {
    renderRoutes({
      routes,
      initialEntries: ['/private/admin'],
      session: buildUser({ role: 'admin' }),
    });
    expect(await screen.findByText('Khu vực admin')).toBeInTheDocument();
  });
});

describe('GuestOnly', () => {
  it('đã đăng nhập -> chuyển về redirectTo an toàn', async () => {
    renderRoutes({
      routes,
      initialEntries: ['/guest?redirectTo=/private'],
      session: buildUser(),
    });
    expect(await screen.findByText('Nội dung riêng tư')).toBeInTheDocument();
  });

  it('chặn redirect ra ngoài domain', async () => {
    renderRoutes({
      routes,
      initialEntries: ['/guest?redirectTo=//evil.com'],
      session: buildUser(),
    });
    expect(await screen.findByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('khách thấy nội dung', async () => {
    renderRoutes({ routes, initialEntries: ['/guest'], session: null });
    expect(await screen.findByText('Trang khách')).toBeInTheDocument();
  });
});

describe('Can', () => {
  it('ẩn/hiện theo permission', async () => {
    renderRoutes({
      routes: [
        {
          path: '/',
          element: (
            <>
              <Can permission={PERMISSIONS.PRODUCT_READ}>
                <span>Xem</span>
              </Can>
              <Can permission={PERMISSIONS.PRODUCT_DELETE} fallback={<span>Không được xoá</span>}>
                <span>Xoá</span>
              </Can>
            </>
          ),
        },
      ],
      session: buildUser(),
    });
    expect(await screen.findByText('Xem')).toBeInTheDocument();
    expect(screen.getByText('Không được xoá')).toBeInTheDocument();
    expect(screen.queryByText('Xoá')).not.toBeInTheDocument();
  });
});
