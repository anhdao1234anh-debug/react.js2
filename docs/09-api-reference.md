# 09. API reference

- Base URL: `http://localhost:8000/api/v1` (dev qua proxy Vite: `/api/v1`)
- Định dạng: JSON. Xác thực: header `Authorization: Bearer <accessToken>`.
- Refresh token nằm trong cookie `refresh_token` (httpOnly, path `/api/v1/auth`) — client gửi request kèm `credentials` (axios: `withCredentials: true`).
- Chú thích cột **Quyền**: 🌐 public · 🔑 cần đăng nhập · `perm` cần permission.

## Health

| Method | Path      | Quyền | Mô tả                                                            |
| ------ | --------- | ----- | ---------------------------------------------------------------- |
| GET    | `/health` | 🌐    | `200 { status: 'ok', services: { database } }`, `503` khi mất DB |

## Auth — `/auth`

| Method | Path                             | Quyền | Body / Query                        | Response `data`                                                             |
| ------ | -------------------------------- | ----- | ----------------------------------- | --------------------------------------------------------------------------- |
| GET    | `/auth/providers`                | 🌐    | —                                   | `{ methods: { password, magicLink }, oauth: ['google','github'] }`          |
| POST   | `/auth/register`                 | 🌐 ⏱  | `{ name, email, password }`         | **201** `AuthResult` + cookie                                               |
| POST   | `/auth/login`                    | 🌐 ⏱  | `{ email, password }`               | `AuthResult` + cookie                                                       |
| POST   | `/auth/refresh`                  | 🍪    | (cookie)                            | `AuthResult` (+ cookie mới nếu xoay)                                        |
| POST   | `/auth/logout`                   | 🍪    | (cookie)                            | `null` — xoá cookie                                                         |
| POST   | `/auth/logout-all`               | 🔑    | —                                   | `{ revoked: number }`                                                       |
| GET    | `/auth/me`                       | 🔑    | —                                   | `AuthUser`                                                                  |
| GET    | `/auth/sessions`                 | 🔑    | —                                   | `Session[]` (kèm `isCurrent`)                                               |
| DELETE | `/auth/sessions/:id`             | 🔑    | —                                   | `null`                                                                      |
| POST   | `/auth/email/verify`             | 🌐 ⏱  | `{ token }`                         | `null` (message)                                                            |
| POST   | `/auth/email/resend`             | 🔑 ⏱  | —                                   | `null` (message)                                                            |
| POST   | `/auth/password/forgot`          | 🌐 ⏱  | `{ email }`                         | `null` (message chung)                                                      |
| POST   | `/auth/password/reset`           | 🌐 ⏱  | `{ token, password }`               | `null` — thu hồi mọi phiên                                                  |
| PATCH  | `/auth/password`                 | 🔑    | `{ currentPassword?, newPassword }` | `AuthUser` — thu hồi các phiên khác                                         |
| POST   | `/auth/magic-link`               | 🌐 ⏱  | `{ email, redirectTo? }`            | `null` (message chung)                                                      |
| POST   | `/auth/magic-link/verify`        | 🌐 ⏱  | `{ token }`                         | `AuthResult & { redirectTo }` + cookie                                      |
| GET    | `/auth/oauth/:provider`          | 🌐    | `?redirectTo=/path`                 | **302** → provider                                                          |
| GET    | `/auth/oauth/:provider/callback` | 🌐    | `?code&state` hoặc `?error`         | **302** → `FRONTEND_URL/auth/oauth/callback?status=success\|error&code=...` |

⏱ = áp dụng `AUTH_RATE_LIMIT_MAX`. 🍪 = dùng cookie refresh.

```ts
type AuthResult = {
  user: AuthUser;
  accessToken: string;
  expiresIn: number /* giây */;
  redirectTo?: string | null;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin' | 'superAdmin';
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string;
  oauthAccounts: { provider: 'google' | 'github'; providerId: string; linkedAt: string }[];
  permissions: string[]; // vd ['profile:read', ...] hoặc ['*']
  hasPassword?: boolean; // false = tài khoản OAuth/magic link chưa đặt mật khẩu
  createdAt: string;
  updatedAt: string;
};
```

## Users — `/users` (tất cả cần 🔑)

| Method | Path              | Permission         | Body / Query                                | Ghi chú                                          |
| ------ | ----------------- | ------------------ | ------------------------------------------- | ------------------------------------------------ |
| PATCH  | `/users/me`       | `profile:update`   | `{ name?, avatarUrl? }` (`''` = xoá avatar) | Trả `AuthUser`                                   |
| GET    | `/users`          | `user:read`        | `?page&limit&search&sort&role&isActive`     | `sort` ∈ `createdAt,name,email,role,lastLoginAt` |
| GET    | `/users/:id`      | `user:read`        | —                                           |                                                  |
| PATCH  | `/users/:id`      | `user:update`      | `{ name?, isActive? }` (strict)             | Chỉ với user cấp thấp hơn                        |
| PATCH  | `/users/:id/role` | `user:role:update` | `{ role }`                                  | Chỉ gán role thấp hơn mình                       |
| DELETE | `/users/:id`      | `user:delete`      | —                                           | **204**; chỉ user cấp thấp hơn                   |

## Products — `/products` (module mẫu)

| Method | Path            | Quyền            | Body / Query                                                                                                                         |
| ------ | --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/products`     | 🌐               | `?page&limit&search&sort&minPrice&maxPrice` — `sort` ∈ `createdAt,price,title` (thêm `-` để giảm dần, nhiều field cách nhau bởi `,`) |
| GET    | `/products/:id` | 🌐               | —                                                                                                                                    |
| POST   | `/products`     | `product:create` | `{ title, price, description?, thumbnail? }` (strict) → **201**                                                                      |
| PATCH  | `/products/:id` | `product:update` | một phần các field trên (≥ 1 field)                                                                                                  |
| DELETE | `/products/:id` | `product:delete` | **204**                                                                                                                              |

## Phân trang

Query: `page` (≥1, mặc định 1), `limit` (1–100, mặc định 20), `search`, `sort`.

```json
{
  "success": true,
  "data": [{ "id": "...", "title": "Bàn phím cơ", "price": 1290000 }],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Mã lỗi

| HTTP | `code`                | Khi nào                                                     |
| ---- | --------------------- | ----------------------------------------------------------- |
| 400  | `BAD_REQUEST`         | Yêu cầu sai (vd sai kiểu ObjectId trong DB query)           |
| 400  | `INVALID_JSON`        | Body JSON sai cú pháp                                       |
| 400  | `INVALID_TOKEN`       | Token email (verify/reset/magic link) sai hoặc hết hạn      |
| 400  | `INVALID_CREDENTIALS` | Sai mật khẩu hiện tại khi đổi mật khẩu                      |
| 400  | `OAUTH_*`             | Lỗi OAuth (trong callback trả qua redirect)                 |
| 401  | `UNAUTHORIZED`        | Chưa đăng nhập / thiếu token                                |
| 401  | `INVALID_CREDENTIALS` | Sai email hoặc mật khẩu khi đăng nhập                       |
| 401  | `TOKEN_EXPIRED`       | Access token hoặc phiên hết hạn → frontend tự refresh       |
| 401  | `INVALID_TOKEN`       | Access/refresh token không hợp lệ                           |
| 401  | `SESSION_REVOKED`     | Phiên đã bị thu hồi (logout, reuse detection, user bị khoá) |
| 403  | `FORBIDDEN`           | Không đủ quyền / cấp bậc                                    |
| 403  | `ACCOUNT_DISABLED`    | Tài khoản bị khoá                                           |
| 403  | `EMAIL_NOT_VERIFIED`  | Tính năng yêu cầu email đã xác thực                         |
| 404  | `NOT_FOUND`           | Tài nguyên không tồn tại                                    |
| 404  | `ROUTE_NOT_FOUND`     | Sai URL                                                     |
| 409  | `CONFLICT`            | Trùng dữ liệu (email đã tồn tại...)                         |
| 413  | `PAYLOAD_TOO_LARGE`   | Body > 1MB                                                  |
| 422  | `VALIDATION_ERROR`    | Dữ liệu không hợp lệ — xem `details[]`                      |
| 429  | `TOO_MANY_REQUESTS`   | Vượt rate limit                                             |
| 500  | `INTERNAL_ERROR`      | Lỗi hệ thống (production ẩn chi tiết)                       |
| 502  | `OAUTH_FAILED`        | Không gọi được provider OAuth                               |

## Ví dụ với curl

```bash
# Đăng nhập, lưu cookie refresh
curl -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"<mật khẩu>"}' \
  http://localhost:8000/api/v1/auth/login

# Gọi API cần quyền
curl -H "Authorization: Bearer <accessToken>" "http://localhost:8000/api/v1/users?limit=5&sort=-createdAt"

# Refresh
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/auth/refresh
```
