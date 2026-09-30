# Backend — CLAUDE.md

Express 5 (ESM) + Mongoose 9 + Zod 4 + pino. Entry `src/server.js`, app factory `src/app.js` (không listen — test dùng trực tiếp). Docs: `docs/03-backend.md`, `docs/04-auth-rbac.md`, `docs/09-api-reference.md`.

## Bản đồ nhanh

| Cần làm                    | Xem / sửa                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Thêm module                | Copy `src/modules/product/` → đăng ký trong `src/modules/index.js`                                                                        |
| Permission / role          | `src/config/permissions.js` (chính sách), `src/core/rbac/` (cơ chế)                                                                       |
| Biến môi trường            | `src/config/env.js` (Zod) + `.env.example` (test `tests/unit/env.test.js`)                                                                |
| Lỗi                        | `throw AppError.notFound('X')` / `new AppError(msg, { statusCode, code })`; code mới thêm vào `src/core/errors/errorCodes.js`             |
| Validate                   | `validate({ params, query, body })` + schema chung `src/core/validation/common.js`; body update dùng `.strict()`                          |
| Guard                      | `authenticate` (`#modules/auth/auth.middleware.js`) → `authorize(PERMISSIONS.X)` (`#core/rbac/index.js`)                                  |
| Phân trang                 | `paginationQuerySchema({ sortFields })` + `repository.paginate(filter, { page, limit, sort: parseSort(sort, FIELDS) })` + `sendPaginated` |
| Tìm kiếm theo chuỗi        | `containsRegex(search)` (đã escape regex)                                                                                                 |
| Gửi mail                   | `sendMail({ to, subject, html, text })` + `renderActionEmail(...)`                                                                        |
| Field nhạy cảm trong model | `{ select: false, private: true }` + `schema.plugin(toJSONPlugin)`                                                                        |

## Mẫu module

```js
// product.routes.js
router.post('/', authenticate, authorize(PERMISSIONS.PRODUCT_CREATE), validate(createProductSchema), productController.create);

// product.controller.js
export const productController = asyncHandlers({
  async create(req, res) { sendCreated(res, await productService.create(req.body, req.user), 'Tạo thành công'); },
});

// product.service.js
async getById(id) { const p = await productRepository.findById(id); if (!p) throw AppError.notFound('Sản phẩm'); return p; }
```

## Test

- `npm test` (trong `backend/`) hoặc `npm run test:be` ở root. File đơn: `npx vitest run tests/integration/auth.oauth.test.js`.
- Integration: `request(app)` + helper `tests/helpers.js` (`loginAs(role)`, `createUser`, `bearer`, `getCookie`, `getTokenFromLastMail`).
- Env test cố định trong `vitest.config.js` (MAIL_DRIVER=memory, OAuth giả, rate limit cao). Mỗi file test một DB in-memory riêng.
- Mock provider OAuth bằng `vi.spyOn(globalThis, 'fetch')`.
- Coverage threshold: lines/functions/statements 85%, branches 75% (`npm run test:coverage`).
