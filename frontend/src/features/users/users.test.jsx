import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildUser, pageMeta } from '@/test/fixtures';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderWithProviders } from '@/test/render';
import UsersPage from './pages/UsersPage';

const member = buildUser({ id: 'm1', name: 'Thành Viên', email: 'm1@example.com' });
const admin = buildUser({ id: 'a1', role: 'admin', name: 'Quản Trị', email: 'a1@example.com' });
const superAdmin = buildUser({ id: 's1', role: 'superAdmin', name: 'Siêu Admin' });

const rowOf = (name) => screen.getByText(name).closest('tr');

beforeEach(() => {
  server.use(http.get(apiUrl('/users'), () => ok([member, admin], { meta: pageMeta(2) })));
});

describe('UsersPage', () => {
  it('admin: thao tác được member, không thao tác được admin khác, không đổi role', async () => {
    renderWithProviders(<UsersPage />, { session: buildUser({ id: 'a2', role: 'admin' }) });
    await screen.findByText('Thành Viên');

    expect(within(rowOf('Thành Viên')).getByRole('button', { name: 'Khoá' })).toBeInTheDocument();
    expect(within(rowOf('Quản Trị')).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Quyền của/ })).not.toBeInTheDocument();
  });

  it('superAdmin: đổi role qua select', async () => {
    let body;
    server.use(
      http.patch(apiUrl('/users/:id/role'), async ({ request }) => {
        body = await request.json();
        return ok({ ...member, role: 'admin' });
      }),
    );
    const { user } = renderWithProviders(<UsersPage />, { session: superAdmin });
    await screen.findByText('Thành Viên');

    const select = screen.getByRole('combobox', { name: 'Quyền của Thành Viên' });
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.value),
    ).toEqual(['member', 'admin']);
    await user.selectOptions(select, 'admin');
    expect(await screen.findByText('Đã đổi quyền của Thành Viên')).toBeInTheDocument();
    expect(body).toEqual({ role: 'admin' });
  });

  it('khoá user và báo lỗi khi server từ chối', async () => {
    server.use(http.patch(apiUrl('/users/:id'), () => fail(403, 'FORBIDDEN', 'Không đủ quyền')));
    const { user } = renderWithProviders(<UsersPage />, { session: superAdmin });
    await screen.findByText('Thành Viên');
    await user.click(within(rowOf('Thành Viên')).getByRole('button', { name: 'Khoá' }));
    expect(await screen.findByText('Không đủ quyền')).toBeInTheDocument();
  });

  it('lọc theo role cập nhật query gửi lên server', async () => {
    const queries = [];
    server.use(
      http.get(apiUrl('/users'), ({ request }) => {
        queries.push(new URL(request.url).searchParams.get('role'));
        return ok([member], { meta: pageMeta(1) });
      }),
    );
    const { user } = renderWithProviders(<UsersPage />, { session: superAdmin });
    await screen.findByText('Thành Viên');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo quyền' }), 'admin');
    await screen.findByText('Thành Viên');
    expect(queries).toContain('admin');
  });
});
