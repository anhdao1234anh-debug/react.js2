// Handler MSW mặc định: mô phỏng backend ở trạng thái "chưa đăng nhập".
// Từng test ghi đè bằng server.use(...) cho tình huống riêng.
import { http, HttpResponse } from 'msw';
import { buildProduct, pageMeta } from '../fixtures';

/** URL khớp mọi origin: "*\/api/v1/<path>" */
export const apiUrl = (path) => `*/api/v1${path}`;

export const ok = (data, extra = {}) => HttpResponse.json({ success: true, data, ...extra });

export const fail = (status, code, message = 'Lỗi', details) =>
  HttpResponse.json(
    {
      success: false,
      error: { code, message, ...(details && { details }) },
      requestId: 'req-test',
    },
    { status },
  );

export const defaultProducts = [
  buildProduct({ id: 'p1', title: 'Bàn phím cơ', price: 1_290_000 }),
  buildProduct({ id: 'p2', title: 'Chuột không dây', price: 490_000 }),
];

export const handlers = [
  http.post(apiUrl('/auth/refresh'), () => fail(401, 'UNAUTHORIZED', 'Không tìm thấy phiên')),
  http.get(apiUrl('/auth/providers'), () =>
    ok({ methods: { password: true, magicLink: true }, oauth: ['google', 'github'] }),
  ),
  http.get(apiUrl('/products'), () =>
    ok(defaultProducts, { meta: pageMeta(defaultProducts.length) }),
  ),
  http.get(apiUrl('/products/:id'), ({ params }) => {
    const product = defaultProducts.find((item) => item.id === params.id);
    return product ? ok(product) : fail(404, 'NOT_FOUND', 'Sản phẩm không tồn tại');
  }),
];
