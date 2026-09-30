# 10. Roadmap — các phase tiếp theo

Source base hiện tại (**Phase 1**) đã chừa sẵn "điểm cắm" cho các phase sau. Tài liệu này mô tả **thiết kế dự kiến** để triển khai nhất quán. Tiến độ theo dõi ở [`CHECK_LIST.md`](../CHECK_LIST.md).

```mermaid
timeline
    title Lộ trình
    Phase 1 (hoàn thành) : Monorepo, core BE/FE : Auth 3 phương thức + RBAC : Test, lint, docs
    Phase 2 : Mail thật (SMTP / Resend) : Template + hàng đợi gửi lại
    Phase 3 : Caching (Redis) : Rate limit store dùng chung
    Phase 4 : Cron jobs (scheduler) : Dọn dẹp định kỳ
    Phase 5 : Quản lý file với Cloudflare R2 : Upload, dùng lại, xoá file mồ côi
```

> Thứ tự đề xuất: **Mail → Cache → Cron → File**, vì Cron cần cho dọn file mồ côi và Cache/Redis có thể làm nền cho hàng đợi.

## Phase 2 — Mail

**Hiện tại:** `core/mail/mailer.js` với driver `console` (dev) và `memory` (test).

**Kế hoạch:**

- Thêm driver `smtp` (nodemailer) và/hoặc `resend` (HTTP API) — chọn bằng `MAIL_DRIVER`.
- Env mới: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` hoặc `RESEND_API_KEY`.
- Template: tách nội dung email khỏi code (vd thư mục `core/mail/templates/*.js` hoặc React Email), hỗ trợ i18n.
- Gửi bất đồng bộ + thử lại (retry với backoff) — dùng hàng đợi (Phase 3/4: BullMQ trên Redis) để request API không chờ SMTP.
- Endpoint liên hệ (`POST /contact`) cho trang Contact (hiện đang demo).

```mermaid
flowchart LR
    S[Service] -->|sendMail| Q[(Queue)]
    Q --> W[Mail worker]
    W -->|driver| P{smtp / resend}
    W -->|lỗi| R[Retry backoff] --> Q
```

## Phase 3 — Caching

- Thêm `core/cache/` với interface thống nhất: `get`, `set(key, value, ttl)`, `del`, `wrap(key, ttl, fn)` (cache-aside), driver `memory` (dev/test) và `redis` (production). Env: `CACHE_DRIVER`, `REDIS_URL`.
- Điểm áp dụng đầu tiên:
  - `authenticate` đọc user theo id → cache vài giây, **xoá cache khi đổi role/khoá/xoá user**.
  - Danh sách public (`GET /products`) → cache ngắn + invalidate khi tạo/sửa/xoá.
- Chuyển store của `express-rate-limit` sang Redis để nhiều instance dùng chung.
- Frontend đã có cache phía client (TanStack Query) — giữ nguyên.

## Phase 4 — Cron jobs

- Thêm `core/jobs/` : đăng ký job theo module (`defineJob({ name, schedule, handler })`), chạy bằng `node-cron` (1 instance) hoặc BullMQ repeatable jobs (nhiều instance, có lock chống chạy trùng).
- Env: `CRON_ENABLED`, `CRON_TIMEZONE`.
- Job dự kiến:
  - Dọn `Session` / `AuthToken` (dự phòng cho TTL index).
  - Dọn **file mồ côi** R2 (Phase 5).
  - Gửi lại email thất bại.
- Mỗi job: log thời gian chạy, kết quả; có lệnh chạy tay `npm run job -- <name>` để debug.

## Phase 5 — Quản lý file với Cloudflare R2

**R2** là object storage tương thích **S3 API** (dùng `@aws-sdk/client-s3`), không tính phí egress.

### Thiết kế dữ liệu

```mermaid
erDiagram
    FILE {
        ObjectId id
        string key "đường dẫn trên R2: uploads/2026/09/<uuid>.webp"
        string originalName
        string mimeType
        number size
        string checksum "sha256 - phát hiện trùng để DÙNG LẠI"
        string status "pending | active | orphaned | deleted"
        ObjectId uploadedBy
        number refCount "số nơi đang tham chiếu"
        date lastReferencedAt
    }
    FILE_REFERENCE {
        ObjectId file
        string resourceType "product | user ..."
        ObjectId resourceId
        string field "thumbnail | avatar | gallery"
    }
    PRODUCT ||--o{ FILE_REFERENCE : "thumbnail"
    FILE ||--o{ FILE_REFERENCE : "được dùng ở"
```

### Vòng đời file

```mermaid
stateDiagram-v2
    [*] --> pending: client xin presigned URL, upload thẳng lên R2
    pending --> active: gắn vào resource (tạo FILE_REFERENCE, refCount++)
    pending --> orphaned: quá 24h chưa được gắn
    active --> active: resource khác dùng lại (checksum trùng) - refCount++
    active --> orphaned: mọi reference bị gỡ (refCount = 0)
    orphaned --> active: được gắn lại trong thời gian ân hạn
    orphaned --> deleted: cron dọn file mồ côi (sau N ngày) - xoá object trên R2
    deleted --> [*]
```

### Luồng upload (presigned URL)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Backend
    participant R2 as Cloudflare R2
    FE->>API: POST /files/presign { name, mimeType, size, checksum }
    API->>API: validate loại/kích thước, kiểm tra checksum đã tồn tại?
    alt đã có file cùng checksum
        API-->>FE: { fileId } (dùng lại, không upload)
    else file mới
        API->>API: tạo FILE status=pending
        API-->>FE: { fileId, uploadUrl (PUT, hết hạn 5 phút) }
        FE->>R2: PUT uploadUrl (file)
        FE->>API: POST /files/:id/complete
        API->>R2: HEAD object (xác minh size/type)
    end
    FE->>API: PATCH /products/:id { thumbnailFileId }
    API->>API: tạo FILE_REFERENCE, gỡ reference cũ (file cũ có thể thành orphaned)
```

### Kế hoạch triển khai

- `core/storage/` : interface `putPresignedUrl`, `head`, `delete`, `getPublicUrl` — driver `r2` và `local` (dev/test).
- Module `file`: model `File`, `FileReference`, service `attach/detach/replace` dùng **transaction** MongoDB để refCount luôn đúng.
- Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `UPLOAD_MAX_SIZE_MB`, `UPLOAD_ALLOWED_TYPES`, `ORPHAN_FILE_RETENTION_DAYS`.
- Frontend: component `FileUpload` + hook `useFileUpload` (progress, retry, tính checksum bằng Web Crypto), thay ô "Ảnh (URL)" ở `ProductForm` và avatar ở hồ sơ.
- Bảo mật: whitelist MIME + kiểm tra magic bytes, giới hạn kích thước, key ngẫu nhiên (không dùng tên gốc), bucket private + URL ký cho file riêng tư.

## Ngoài lộ trình chính (ý tưởng)

- CI (GitHub Actions): `npm ci && npm run check` trên mỗi PR; husky + lint-staged.
- E2E test bằng Playwright.
- Docker Compose (MongoDB + Redis + app) cho môi trường dev đồng nhất.
- OpenAPI/Swagger sinh từ Zod schema.
- i18n cho frontend và message lỗi backend.
- 2FA (TOTP) cho admin/superAdmin, audit log thao tác quản trị.
