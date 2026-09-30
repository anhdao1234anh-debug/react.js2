# Tài liệu dự án

> Source base fullstack tái sử dụng cho nhiều dự án: **Express 5 (ESM) + MongoDB** ở backend, **React 19 + TanStack Query + Tailwind CSS** ở frontend.

## Mục lục

| #   | Tài liệu                                     | Nội dung chính                                                          |
| --- | -------------------------------------------- | ----------------------------------------------------------------------- |
| 01  | [Bắt đầu nhanh](01-getting-started.md)       | Cài đặt, chạy dự án, tài khoản mặc định, lệnh thường dùng               |
| 02  | [Kiến trúc tổng quan](02-architecture.md)    | Monorepo, `core` vs `modules/features`, luồng request                   |
| 03  | [Backend](03-backend.md)                     | Cấu trúc thư mục, core, module, error handling, validation, thêm module |
| 04  | [Xác thực & phân quyền](04-auth-rbac.md)     | 3 phương thức đăng nhập, refresh token rotation, RBAC 3 role            |
| 05  | [Frontend](05-frontend.md)                   | Routing, TanStack Query, form, custom hook, UI kit, thêm feature        |
| 06  | [Biến môi trường](06-environment.md)         | Toàn bộ biến env, mức độ quan trọng, cách tạo, cơ chế đồng bộ           |
| 07  | [Testing](07-testing.md)                     | Chiến lược test, công cụ, cách viết test mới                            |
| 08  | [Quy ước & quy trình](08-conventions.md)     | Coding convention, lint/format, commit, checklist khi thêm tính năng    |
| 09  | [API reference](09-api-reference.md)         | Danh sách endpoint, request/response mẫu, mã lỗi                        |
| 10  | [Roadmap các phase tiếp theo](10-roadmap.md) | Cron jobs, caching, mail, quản lý file với Cloudflare R2                |

## Đọc theo vai trò

- **Mới tham gia dự án**: 01 → 02 → 08.
- **Làm backend**: 03 → 04 → 09.
- **Làm frontend**: 05 → 04 (phần frontend) → 09.
- **DevOps / triển khai**: 06 → 10.

## Quy ước trong tài liệu

- Thuật ngữ tiếng Anh được **giữ nguyên** và chú thích tiếng Việt ở lần xuất hiện đầu, ví dụ: _middleware (lớp xử lý trung gian giữa request và handler)_.
- Đường dẫn file tính từ thư mục gốc repo, ví dụ `backend/src/core/errors/AppError.js`.
- Sơ đồ dùng [Mermaid](https://mermaid.js.org/) — xem trực tiếp trên GitHub/GitLab hoặc VS Code (extension `bierner.markdown-mermaid`).
