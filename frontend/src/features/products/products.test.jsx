import { act, screen, waitFor, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { buildProduct, buildUser, pageMeta } from '@/test/fixtures';
import { apiUrl, fail, ok } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderHookWithProviders, renderWithProviders } from '@/test/render';
import { useCreateProduct, useProducts } from './hooks/useProducts';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListPage from './pages/ProductListPage';
import ProductManagementPage from './pages/ProductManagementPage';
import { productFormSchema } from './schemas/productSchema';

describe('productFormSchema', () => {
  it('ép kiểu giá, bắt buộc nhập giá, cho phép thumbnail rỗng', () => {
    const base = { title: 'Bàn phím', price: '1000', description: '', thumbnail: '' };
    expect(productFormSchema.parse(base).price).toBe(1000);
    expect(productFormSchema.safeParse({ ...base, price: '' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, price: '-1' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, thumbnail: 'not-url' }).success).toBe(false);
  });
});

describe('useProducts / useCreateProduct', () => {
  it('gửi đúng query params và trả { items, meta }', async () => {
    let query;
    server.use(
      http.get(apiUrl('/products'), ({ request }) => {
        query = Object.fromEntries(new URL(request.url).searchParams);
        return ok([buildProduct()], { meta: pageMeta(1) });
      }),
    );
    const { result } = renderHookWithProviders(() =>
      useProducts({ page: 2, limit: 5, search: 'phím' }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query).toEqual({ page: '2', limit: '5', search: 'phím' });
    expect(result.current.data.items).toHaveLength(1);
    expect(result.current.data.meta.total).toBe(1);
  });

  it('tạo sản phẩm xong làm mới danh sách (invalidate)', async () => {
    let listCalls = 0;
    server.use(
      http.get(apiUrl('/products'), () => {
        listCalls += 1;
        return ok([], { meta: pageMeta(0) });
      }),
      http.post(apiUrl('/products'), () => ok(buildProduct({ id: 'new' }))),
    );
    const { result } = renderHookWithProviders(() => ({
      list: useProducts({ page: 1 }),
      create: useCreateProduct(),
    }));
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(listCalls).toBe(1);

    await act(() => result.current.create.mutateAsync({ title: 'Mới', price: 1 }));
    await waitFor(() => expect(listCalls).toBe(2));
  });
});

describe('ProductListPage', () => {
  it('hiển thị lưới sản phẩm', async () => {
    renderWithProviders(<ProductListPage />, { session: null });
    expect(await screen.findByText('Bàn phím cơ')).toBeInTheDocument();
    expect(screen.getByText('Chuột không dây')).toBeInTheDocument();
  });

  it('empty state khi không có kết quả', async () => {
    server.use(http.get(apiUrl('/products'), () => ok([], { meta: pageMeta(0) })));
    renderWithProviders(<ProductListPage />, { route: '/?search=xyz', session: null });
    expect(await screen.findByText('Không có sản phẩm nào')).toBeInTheDocument();
    expect(screen.getByText('Không tìm thấy kết quả cho "xyz".')).toBeInTheDocument();
  });

  it('lỗi tải dữ liệu -> nút thử lại', async () => {
    server.use(http.get(apiUrl('/products'), () => fail(500, 'INTERNAL_ERROR', 'Máy chủ lỗi')));
    renderWithProviders(<ProductListPage />, { session: null });
    expect(await screen.findByText('Không tải được dữ liệu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});

describe('ProductDetailPage', () => {
  it('hiển thị chi tiết theo id trên URL', async () => {
    renderWithProviders(<ProductDetailPage />, { route: '/products/p2', path: '/products/:id' });
    expect(await screen.findByRole('heading', { name: 'Chuột không dây' })).toBeInTheDocument();
  });
});

describe('ProductManagementPage', () => {
  const admin = buildUser({ role: 'admin' });

  it('tạo sản phẩm qua modal', async () => {
    let body;
    server.use(
      http.post(apiUrl('/products'), async ({ request }) => {
        body = await request.json();
        return ok(buildProduct({ id: 'p3', ...body }));
      }),
    );
    const { user } = renderWithProviders(<ProductManagementPage />, { session: admin });
    await screen.findByText('Bàn phím cơ');

    await user.click(screen.getByRole('button', { name: '+ Thêm sản phẩm' }));
    const dialog = screen.getByRole('dialog', { name: 'Thêm sản phẩm' });
    await user.type(within(dialog).getByLabelText(/Tên sản phẩm/), 'Màn hình 27"');
    await user.type(within(dialog).getByLabelText(/Giá/), '5990000');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo sản phẩm' }));

    expect(await screen.findByText('Đã tạo sản phẩm')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(body).toMatchObject({ title: 'Màn hình 27"', price: 5990000 });
  });

  it('sửa sản phẩm: form điền sẵn dữ liệu, lỗi 422 gắn vào field', async () => {
    server.use(
      http.patch(apiUrl('/products/:id'), () =>
        fail(422, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', [
          { location: 'body', path: 'title', message: 'Tên đã bị trùng' },
        ]),
      ),
    );
    const { user } = renderWithProviders(<ProductManagementPage />, { session: admin });
    await screen.findByText('Bàn phím cơ');

    await user.click(screen.getAllByRole('button', { name: 'Sửa' })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Sửa sản phẩm' });
    expect(within(dialog).getByLabelText(/Tên sản phẩm/)).toHaveValue('Bàn phím cơ');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await within(dialog).findByText('Tên đã bị trùng')).toBeInTheDocument();
  });

  it('xoá sản phẩm sau khi xác nhận', async () => {
    let deletedId;
    server.use(
      http.delete(apiUrl('/products/:id'), ({ params }) => {
        deletedId = params.id;
        return new Response(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<ProductManagementPage />, { session: admin });
    await screen.findByText('Bàn phím cơ');

    await user.click(screen.getAllByRole('button', { name: 'Xoá' })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Xoá sản phẩm?' });
    await user.click(within(dialog).getByRole('button', { name: 'Xoá' }));

    expect(await screen.findByText('Đã xoá sản phẩm')).toBeInTheDocument();
    expect(deletedId).toBe('p1');
  });

  it('member không thấy nút thêm/sửa/xoá', async () => {
    renderWithProviders(<ProductManagementPage />, { session: buildUser() });
    await screen.findByText('Bàn phím cơ');
    expect(screen.queryByRole('button', { name: '+ Thêm sản phẩm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xoá' })).not.toBeInTheDocument();
  });
});
