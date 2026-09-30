# CHECK_LIST — Theo dõi tiến độ

> Quy ước: `[x]` xong · `[ ]` chưa làm · `[~]` đang làm. Cập nhật file này **mỗi khi bắt đầu / hoàn thành** một hạng mục (ghi ngày `YYYY-MM-DD`).
> Thiết kế chi tiết các phase: [`docs/10-roadmap.md`](docs/10-roadmap.md).

## Tổng quan

| Phase | Nội dung                                         | Trạng thái      | Ngày hoàn thành |
| ----- | ------------------------------------------------ | --------------- | --------------- |
| 1     | Nền tảng: monorepo, core, auth, RBAC, test, docs | ✅ Hoàn thành   | 2026-09-25      |
| 2     | Mail thật (SMTP/Resend), template, retry         | ⬜ Chưa bắt đầu |                 |
| 3     | Caching (Redis)                                  | ⬜ Chưa bắt đầu |                 |
| 4     | Cron jobs                                        | ⬜ Chưa bắt đầu |                 |
| 5     | Quản lý file Cloudflare R2                       | ⬜ Chưa bắt đầu |                 |

---

## Phase 1 — Nền tảng (2026-09-25)

### Cấu trúc & tooling

- [x] Đổi tên `back-end` → `backend`, `front-end` → `frontend`; thêm `docs/`, `scripts/`
- [x] Sao lưu source cũ vào `.backup/legacy-source-2026-09-25.tgz` (đã gitignore)
- [x] npm workspaces + script chung ở root (`dev`, `test`, `lint`, `format`, `check`, `env:*`, `seed`, `clean`, `setup`)
- [x] ESLint flat config toàn repo (react-hooks, react-refresh, vitest, prettier)
- [x] Prettier (+ sắp xếp class Tailwind), `.editorconfig`, `.gitattributes`, `.nvmrc`, `.vscode/`
- [x] `CLAUDE.md` (root, backend, frontend)

### Môi trường

- [x] `.env.example` backend & frontend: mỗi biến có Ý nghĩa / Cách tạo / Mức độ
- [x] `npm run setup` (tạo `.env`, tự sinh secret), `env:check`, `env:sync` (giữ giá trị, backup)
- [x] Validate env bằng Zod (BE + FE), test đảm bảo schema ↔ example đồng bộ
- [x] Chuyển `.env` cũ: `DB_URL` → `MONGODB_URI`, `PORT` (bỏ `;` thừa)

### Backend core

- [x] ESM + subpath imports (`#core/*`...)
- [x] `AppError` + `ErrorCodes` + `errorHandler` (Zod, Mongoose, Mongo 11000, JWT, body-parser) + `notFound`
- [x] `asyncHandler` / `asyncHandlers`, response helpers, `defineModule` + đăng ký module
- [x] `validate()` Zod cho params/query/body (tương thích Express 5)
- [x] Logger pino (redact), requestId, http logger
- [x] helmet, cors whitelist, compression, rate limit (chung + auth), graceful shutdown
- [x] `BaseRepository` (CRUD + paginate), plugin `toJSON` (ẩn field `private`)
- [x] Utils: duration, pagination, sort whitelist, object, string (escape regex), url (chống open redirect)
- [x] Mail service (driver console/memory) + layout email

### Auth & RBAC

- [x] Email/mật khẩu: register, login, verify email, resend, forgot/reset, đổi/đặt mật khẩu
- [x] Magic link (tạo tài khoản khi mở link, one-time token)
- [x] OAuth 2.0 Google + GitHub (state, PKCE, liên kết theo email đã xác thực)
- [x] Access token JWT + refresh token rotation, grace period, reuse detection, quản lý thiết bị
- [x] RBAC 3 role (member/admin/superAdmin), permission matrix, quy tắc cấp bậc, `authorize()`
- [x] Seed superAdmin + sản phẩm mẫu

### Modules backend

- [x] `health`
- [x] `auth`
- [x] `user` (quản trị + hồ sơ cá nhân)
- [x] `product` (module mẫu CRUD, viết lại từ code cũ)

### Frontend

- [x] Vite + Tailwind v4 + alias `@`
- [x] Routing `createBrowserRouter`, file routes riêng, lazy load, guard (RequireAuth, RequirePermission, GuestOnly), error boundary, 404/403
- [x] httpClient axios: Bearer, auto refresh single-flight, chuẩn hoá `ApiError`
- [x] TanStack Query: queryClient, key factory, phiên đăng nhập trong cache
- [x] Form: react-hook-form + Zod + `useFormMutation` (map lỗi 422 vào field)
- [x] UI kit (Button, TextField, Modal, ConfirmDialog, Card, Alert, Badge, Avatar, Pagination, EmptyState, Toaster)
- [x] Custom hooks: `useAuth`, `useProducts`, `useProductManagement`, `useUsers`, `useUserManagement`, `useAccountSessions`, `useListParams`, `useRunOnce`...
- [x] Trang: Home, About, Contact, Products (list/detail), Auth (8 trang), Dashboard, Account, Quản lý sản phẩm, Quản lý người dùng

### Test & docs

- [x] Backend: unit + integration (Supertest + MongoDB in-memory), coverage threshold
- [x] Frontend: Testing Library + MSW (core, hooks, forms, guards, pages, routes)
- [x] Scripts: test quản lý env
- [x] Docs tiếng Việt + Mermaid (10 tài liệu trong `docs/`)

### Việc cần làm thủ công (người dùng)

- [ ] Kiểm tra `MONGODB_URI` trong `backend/.env` — URI Atlas hiện **không có tên database** nên dữ liệu vào DB mặc định `test`; nên thêm `/<tên_db>` trước dấu `?`
- [ ] Chạy `npm run seed` để tạo superAdmin (mật khẩu: `SUPER_ADMIN_PASSWORD` trong `backend/.env`), đổi mật khẩu sau lần đăng nhập đầu
- [ ] (Tuỳ chọn) Tạo OAuth app Google/GitHub và điền `*_CLIENT_ID/SECRET`
- [ ] `git init` + commit đầu tiên (thư mục hiện chưa phải git repo)

---

## Phase 2 — Mail

- [ ] Driver `smtp` (nodemailer) và/hoặc `resend` + env tương ứng
- [ ] Template email tách khỏi code, hỗ trợ đa ngôn ngữ
- [ ] Gửi qua hàng đợi + retry backoff
- [ ] Endpoint `POST /contact` cho trang Liên hệ
- [ ] Test (mock transport) + docs

## Phase 3 — Caching

- [ ] `core/cache` (driver memory/redis): get/set/del/wrap
- [ ] Cache user trong `authenticate` + invalidate khi đổi role/khoá/xoá
- [ ] Cache danh sách public + invalidate khi ghi
- [ ] Rate limit store Redis
- [ ] Test + docs + env (`CACHE_DRIVER`, `REDIS_URL`)

## Phase 4 — Cron jobs

- [ ] `core/jobs`: `defineJob`, scheduler (node-cron / BullMQ repeatable), lock chống chạy trùng
- [ ] Job dọn session/token hết hạn
- [ ] Lệnh chạy tay `npm run job -- <name>`
- [ ] Test + docs + env (`CRON_ENABLED`, `CRON_TIMEZONE`)

## Phase 5 — Quản lý file (Cloudflare R2)

- [ ] `core/storage` (driver r2/local) với presigned URL
- [ ] Module `file`: model `File`, `FileReference`, refCount, dùng lại theo checksum
- [ ] Gắn/gỡ file vào resource bằng transaction; thay `thumbnail` của product, avatar user
- [ ] Cron dọn file mồ côi (pending quá hạn, refCount = 0 quá N ngày)
- [ ] FE: `FileUpload` + `useFileUpload` (progress, checksum)
- [ ] Bảo mật: whitelist MIME + magic bytes, giới hạn kích thước
- [ ] Test + docs + env (`R2_*`, `UPLOAD_*`, `ORPHAN_FILE_RETENTION_DAYS`)

## Backlog (chưa xếp phase)

- [ ] CI GitHub Actions (`npm ci && npm run check`), husky + lint-staged
- [ ] E2E Playwright
- [ ] Docker Compose (MongoDB, Redis)
- [ ] OpenAPI sinh từ Zod
- [ ] i18n, 2FA cho admin, audit log
